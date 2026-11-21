CREATE DATABASE IF NOT EXISTS medibook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medibook;

DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;

CREATE TABLE patients (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patients_email (email)
) ENGINE=InnoDB;

CREATE TABLE doctors (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  consultation_fee DECIMAL(10,2) NOT NULL,
  room VARCHAR(10) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doctors_room (room),
  CONSTRAINT chk_doctors_fee CHECK (consultation_fee >= 0)
) ENGINE=InnoDB;

CREATE TABLE appointments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appt_datetime DATETIME NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  status ENUM('booked','cancelled') NOT NULL DEFAULT 'booked',
  active_slot DATETIME NULL,
  refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cancelled_at DATETIME NULL,
  booked_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  UNIQUE KEY uq_doctor_active_slot (doctor_id, active_slot),
  CONSTRAINT chk_appointment_amount CHECK (amount_paid >= 0),
  CONSTRAINT chk_refund_amount CHECK (refund_amount >= 0),
  CONSTRAINT chk_cancelled_fields CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
    (status = 'booked' AND cancelled_at IS NULL)
  )
) ENGINE=InnoDB;
