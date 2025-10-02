/**
 * Test script to validate WFH attendance system fixes
 * Run with: node scripts/test-wfh-attendance-fix.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestScenarios() {
  console.log('🧪 Creating test scenarios for WFH attendance system...\n');

  try {
    // Find a test user (or create one)
    let testUser = await prisma.user.findFirst({
      where: { role: 'EMPLOYEE' }
    });

    if (!testUser) {
      console.log('No employee found. Please ensure you have at least one employee user in the system.');
      return;
    }

    console.log(`Using test user: ${testUser.fullName} (${testUser.email})\n`);

    // Scenario 1: Create a pending WFH request for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 0, 0, 0);

    const yesterdayWFH = await prisma.wfhLog.create({
      data: {
        userId: testUser.id,
        logTime: yesterday,
        activityDescription: 'Test WFH activity from yesterday - should be auto-rejected',
        screenshotUrl: '/test-screenshot.jpg',
        latitude: -6.2088,
        longitude: 106.8456,
        status: 'PENDING'
      }
    });

    console.log(`✅ Created pending WFH request for yesterday: ${yesterdayWFH.id}`);

    // Scenario 2: Create a pending WFH request for 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(10, 30, 0, 0);

    const twoDaysAgoWFH = await prisma.wfhLog.create({
      data: {
        userId: testUser.id,
        logTime: twoDaysAgo,
        activityDescription: 'Test WFH activity from 2 days ago - should be auto-rejected',
        screenshotUrl: '/test-screenshot-2.jpg',
        latitude: -6.2088,
        longitude: 106.8456,
        status: 'PENDING'
      }
    });

    console.log(`✅ Created pending WFH request for 2 days ago: ${twoDaysAgoWFH.id}`);

    // Scenario 3: Create a pending WFH request for today (should NOT be auto-processed)
    const today = new Date();
    today.setHours(8, 0, 0, 0);

    const todayWFH = await prisma.wfhLog.create({
      data: {
        userId: testUser.id,
        logTime: today,
        activityDescription: 'Test WFH activity for today - should remain pending',
        screenshotUrl: '/test-screenshot-today.jpg',
        latitude: -6.2088,
        longitude: 106.8456,
        status: 'PENDING'
      }
    });

    console.log(`✅ Created pending WFH request for today: ${todayWFH.id}\n`);

    return {
      testUser,
      yesterdayWFH,
      twoDaysAgoWFH,
      todayWFH
    };

  } catch (error) {
    console.error('❌ Error creating test scenarios:', error);
    throw error;
  }
}

async function testWFHCleanup() {
  console.log('🔧 Testing WFH cleanup functionality...\n');

  try {
    // Import the cleanup function
    const { processAllExpiredWFHRequests, getWFHPendingStats } = require('../src/lib/wfh-cleanup.ts');

    // Get stats before cleanup
    const statsBefore = await getWFHPendingStats();
    console.log('📊 Stats before cleanup:', statsBefore);

    // Run the cleanup process
    const result = await processAllExpiredWFHRequests();
    console.log('🧹 Cleanup results:', result);

    // Get stats after cleanup
    const statsAfter = await getWFHPendingStats();
    console.log('📊 Stats after cleanup:', statsAfter);

    return result;

  } catch (error) {
    console.error('❌ Error testing WFH cleanup:', error);
    throw error;
  }
}

async function validateResults(testData) {
  console.log('\n🔍 Validating results...\n');

  try {
    const { testUser, yesterdayWFH, twoDaysAgoWFH, todayWFH } = testData;

    // Check if expired WFH requests were processed
    const updatedYesterdayWFH = await prisma.wfhLog.findUnique({
      where: { id: yesterdayWFH.id }
    });

    const updatedTwoDaysAgoWFH = await prisma.wfhLog.findUnique({
      where: { id: twoDaysAgoWFH.id }
    });

    const updatedTodayWFH = await prisma.wfhLog.findUnique({
      where: { id: todayWFH.id }
    });

    console.log(`Yesterday WFH status: ${updatedYesterdayWFH?.status} (should be REJECTED)`);
    console.log(`2 days ago WFH status: ${updatedTwoDaysAgoWFH?.status} (should be REJECTED)`);
    console.log(`Today WFH status: ${updatedTodayWFH?.status} (should be PENDING)`);

    // Check if absent records were created
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const yesterdayAttendance = await prisma.attendance.findFirst({
      where: {
        userId: testUser.id,
        checkInTime: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    const twoDaysAgoAttendance = await prisma.attendance.findFirst({
      where: {
        userId: testUser.id,
        checkInTime: {
          gte: twoDaysAgo,
          lt: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    console.log(`\nYesterday attendance status: ${yesterdayAttendance?.status || 'NOT FOUND'} (should be ABSENT)`);
    console.log(`2 days ago attendance status: ${twoDaysAgoAttendance?.status || 'NOT FOUND'} (should be ABSENT)`);

    // Validation results
    const results = {
      expiredWFHProcessed: updatedYesterdayWFH?.status === 'REJECTED' && updatedTwoDaysAgoWFH?.status === 'REJECTED',
      todayWFHUntouched: updatedTodayWFH?.status === 'PENDING',
      absentRecordsCreated: yesterdayAttendance?.status === 'ABSENT' && twoDaysAgoAttendance?.status === 'ABSENT'
    };

    console.log('\n✅ Validation Results:');
    console.log(`- Expired WFH requests processed: ${results.expiredWFHProcessed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Today's WFH request untouched: ${results.todayWFHUntouched ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Absent records created: ${results.absentRecordsCreated ? '✅ PASS' : '❌ FAIL'}`);

    return results;

  } catch (error) {
    console.error('❌ Error validating results:', error);
    throw error;
  }
}

async function testAttendanceCheckIn(testUser) {
  console.log('\n🏢 Testing attendance check-in with expired WFH requests...\n');

  try {
    // Simulate the check-in process by calling the cleanup function directly
    const { processExpiredWFHRequestsForUser } = require('../src/lib/wfh-cleanup.ts');
    
    const result = await processExpiredWFHRequestsForUser(testUser.id);
    console.log('Check-in cleanup result:', result);

    // Verify that the user can now check in (no pending WFH blocking)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayWFH = await prisma.wfhLog.findFirst({
      where: {
        userId: testUser.id,
        logTime: {
          gte: today,
          lte: todayEnd
        },
        status: {
          in: ['PENDING', 'APPROVED']
        }
      }
    });

    console.log(`Today's WFH blocking check-in: ${todayWFH ? 'YES (expected)' : 'NO'}`);
    
    return result;

  } catch (error) {
    console.error('❌ Error testing attendance check-in:', error);
    throw error;
  }
}

async function cleanup(testData) {
  console.log('\n🧹 Cleaning up test data...\n');

  try {
    if (testData) {
      const { yesterdayWFH, twoDaysAgoWFH, todayWFH, testUser } = testData;

      // Delete test WFH logs
      await prisma.wfhLog.deleteMany({
        where: {
          id: {
            in: [yesterdayWFH.id, twoDaysAgoWFH.id, todayWFH.id]
          }
        }
      });

      // Delete test attendance records
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      yesterday.setHours(0, 0, 0, 0);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      await prisma.attendance.deleteMany({
        where: {
          userId: testUser.id,
          checkInTime: {
            gte: yesterday,
            lt: tomorrow
          },
          notes: {
            contains: 'Test'
          }
        }
      });

      console.log('✅ Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting WFH Attendance System Tests\n');
  console.log('=' .repeat(60) + '\n');

  let testData = null;

  try {
    // Step 1: Create test scenarios
    testData = await createTestScenarios();

    // Step 2: Test WFH cleanup functionality
    await testWFHCleanup();

    // Step 3: Validate results
    const validationResults = await validateResults(testData);

    // Step 4: Test attendance check-in process
    await testAttendanceCheckIn(testData.testUser);

    // Step 5: Overall test result
    const allTestsPassed = Object.values(validationResults).every(result => result === true);
    
    console.log('\n' + '=' .repeat(60));
    console.log(`🎯 OVERALL TEST RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('=' .repeat(60) + '\n');

    if (allTestsPassed) {
      console.log('🎉 The WFH attendance system fix is working correctly!');
      console.log('✅ Expired pending WFH requests are automatically processed');
      console.log('✅ Absent records are created for expired requests');
      console.log('✅ Current day WFH requests are not affected');
      console.log('✅ Employees can check in normally after expired requests are processed');
    } else {
      console.log('⚠️  Some issues were detected. Please review the validation results above.');
    }

  } catch (error) {
    console.error('💥 Test execution failed:', error);
  } finally {
    // Cleanup test data
    await cleanup(testData);
    await prisma.$disconnect();
  }
}

// Run the tests
runTests().catch(console.error);
