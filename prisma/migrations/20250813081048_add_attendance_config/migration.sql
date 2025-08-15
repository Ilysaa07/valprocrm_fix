-- CreateTable
CREATE TABLE `attendance_config` (
    `id` VARCHAR(191) NOT NULL,
    `workStartHour` INTEGER NOT NULL DEFAULT 9,
    `workEndHour` INTEGER NOT NULL DEFAULT 17,
    `officeLat` DOUBLE NULL,
    `officeLng` DOUBLE NULL,
    `radiusMeters` INTEGER NOT NULL DEFAULT 200,
    `useGeofence` BOOLEAN NOT NULL DEFAULT false,
    `enforceGeofence` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
