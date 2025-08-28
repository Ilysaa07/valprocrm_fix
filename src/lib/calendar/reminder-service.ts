import { prisma } from '@/lib/prisma'

export class ReminderService {
  static async processReminders() {
    const now = new Date()
    
    try {
      // Get all unsent reminders that are due
      const dueReminders = await prisma.eventReminder.findMany({
        where: {
          isSent: false,
          reminderTime: {
            lte: now
          }
        },
        include: {
          event: {
            include: {
              createdBy: true,
              attendees: {
                include: {
                  user: true
                }
              },
              project: {
                select: {
                  id: true,
                  name: true
                }
              },
              contact: {
                select: {
                  id: true,
                  name: true,
                  companyName: true
                }
              }
            }
          }
        }
      })

      let processedCount = 0

      for (const reminder of dueReminders) {
        try {
          await this.sendReminder(reminder)
          
          // Mark reminder as sent
          await prisma.eventReminder.update({
            where: { id: reminder.id },
            data: {
              isSent: true,
              sentAt: now
            }
          })

          processedCount++
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error)
        }
      }

      return { processedCount, totalReminders: dueReminders.length }
    } catch (error) {
      console.error('Error processing reminders:', error)
      throw error
    }
  }

  private static async sendReminder(reminder: any) {
    const { event } = reminder
    
    // Get all recipients (creator + attendees)
    const recipients = new Set([event.createdBy])
    
    event.attendees.forEach((attendee: any) => {
      if (attendee.user && attendee.user.id !== event.createdBy.id) {
        recipients.add(attendee.user)
      }
    })

    // Create notifications for each recipient
    const notifications = Array.from(recipients).map(user => ({
      title: `Event Reminder: ${event.title}`,
      message: this.formatReminderMessage(reminder, event),
      type: 'CALENDAR' as const,
      priority: this.getPriorityFromEvent(event),
      userId: user.id,
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        startTime: event.startTime.toISOString(),
        reminderType: reminder.reminderType,
        category: event.category
      }
    }))

    // Batch create notifications
    await prisma.notification.createMany({
      data: notifications
    })

    // Handle different reminder types
    switch (reminder.reminderType) {
      case 'EMAIL':
        await this.sendEmailReminder(reminder, event, Array.from(recipients))
        break
      case 'SMS':
        await this.sendSMSReminder(reminder, event, Array.from(recipients))
        break
      case 'WHATSAPP':
        await this.sendWhatsAppReminder(reminder, event, Array.from(recipients))
        break
      case 'NOTIFICATION':
      default:
        // Already handled by creating notifications above
        break
    }
  }

  private static formatReminderMessage(reminder: any, event: any): string {
    if (reminder.message) {
      return reminder.message
    }

    const startTime = new Date(event.startTime)
    const timeUntil = this.getTimeUntilEvent(startTime)
    
    let message = `Don't forget about "${event.title}"`
    
    if (timeUntil) {
      message += ` starting ${timeUntil}`
    } else {
      message += ` scheduled for ${startTime.toLocaleString()}`
    }

    if (event.location) {
      message += ` at ${event.location}`
    }

    if (event.project) {
      message += ` (Project: ${event.project.name})`
    }

    if (event.contact) {
      message += ` (Client: ${event.contact.name}${event.contact.companyName ? ` - ${event.contact.companyName}` : ''})`
    }

    return message
  }

  private static getTimeUntilEvent(eventTime: Date): string | null {
    const now = new Date()
    const diffMs = eventTime.getTime() - now.getTime()
    
    if (diffMs < 0) return null // Event has passed
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    } else if (diffMinutes > 0) {
      return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
    } else {
      return 'now'
    }
  }

  private static getPriorityFromEvent(event: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    switch (event.priority) {
      case 'URGENT':
      case 'HIGH':
        return 'HIGH'
      case 'MEDIUM':
        return 'MEDIUM'
      case 'LOW':
      default:
        return 'LOW'
    }
  }

  private static async sendEmailReminder(reminder: any, event: any, recipients: any[]) {
    // TODO: Implement email sending logic
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('Email reminder would be sent to:', recipients.map(r => r.email))
  }

  private static async sendSMSReminder(reminder: any, event: any, recipients: any[]) {
    // TODO: Implement SMS sending logic
    // This would integrate with your SMS service (Twilio, AWS SNS, etc.)
    console.log('SMS reminder would be sent to:', recipients.map(r => r.phone || 'No phone'))
  }

  private static async sendWhatsAppReminder(reminder: any, event: any, recipients: any[]) {
    // TODO: Implement WhatsApp sending logic
    // This would integrate with WhatsApp Business API
    console.log('WhatsApp reminder would be sent to:', recipients.map(r => r.phone || 'No phone'))
  }

  static async scheduleRecurringReminders(eventId: string) {
    // Get the event with its recurrence rule
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        reminders: true
      }
    })

    if (!event || !event.recurrenceRule) {
      return
    }

    // TODO: Implement RRULE parsing and recurring reminder creation
    // This would parse the recurrence rule and create reminders for future occurrences
    console.log('Recurring reminders would be scheduled for event:', event.title)
  }

  static async getUpcomingReminders(userId: string, hours: number = 24) {
    const now = new Date()
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000)

    return await prisma.eventReminder.findMany({
      where: {
        isSent: false,
        reminderTime: {
          gte: now,
          lte: futureTime
        },
        event: {
          OR: [
            { createdById: userId },
            {
              attendees: {
                some: {
                  userId: userId
                }
              }
            }
          ]
        }
      },
      include: {
        event: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            },
            contact: {
              select: {
                id: true,
                name: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: {
        reminderTime: 'asc'
      }
    })
  }
}
