# TuitionQueueTrack

### Real-time Web and Mobile-Based RFID Queue Monitoring and Student Payment Management System with AI-Based Prediction and Queue Optimization

TuitionQueueTrack is a real-time web and mobile-based system developed to streamline student fee payment transactions in educational institutions. The system integrates RFID-based student identification, intelligent queue monitoring, payment management, and AI-assisted waiting time prediction to provide an efficient, organized, and secure transaction experience.

## Key Features

* RFID-Based Student Identification
* Digital Queue Number Generation
* Real-Time Queue Monitoring and Updates
* AI-Assisted Waiting Time Estimation
* Queue Optimization
* Student Payment Tracking
* Student Queue Monitoring via Mobile Application
* Administrative Dashboard and Management Panel
* Payment Transaction Recording and Reporting

## Technology Stack

### Frontend

* HTML
* CSS
* JavaScript
* React Native (Expo)

### Backend

* Python
* Flask

### Database

* MySQL

## Hardware Components

* Arduino Uno
* RC522 RFID Reader Module
* 16x2 LCD Display with I2C (0x27)
* ISD1820 Voice Recording Module with Speaker
* 3 Infrared (IR) Sensors
* 1 Green LED
* 1 Red LED
* 3 Clear LEDs
* Active Buzzer
* Expansion Board

## Hardware Materials

* 1x1 Hinges
* Safety Hasp (#1 inch)
* Staple Wire (#1)
* 1/4 Plywood

## Construction Materials

* Popsicle Sticks
* Illustration Board
* Foam Board
* Acrylic Glass

### Student Module (Mobile Application)

* RFID-based identification
* Queue registration
* Real-time queue monitoring
* Estimated waiting time display
* Payment status monitoring
* Queue notifications and updates
* Remote queue tracking through mobile devices

### Admin Module (Web Application)

* Queue management
* Student payment management
* Transaction monitoring
* Queue analytics and reports
* Dashboard visualization


## Project Structure

```text
backend/
├── static/
├── templates/

frontend/
├── components/
├── screens/
├── services/
└── assets/
```

## Objective

The project aims to develop an RFID-based queue monitoring and student payment management system that automatically assigns queue numbers, tracks queue status, records payment transactions, reduces manual processes, and minimizes human errors. The system integrates AI-assisted waiting time prediction using real-time queue data and historical transaction records, providing students with real-time queue updates and notifications through web and mobile platforms. It also improves queue management and space utilization by eliminating fixed physical lines, allowing students to monitor their queue status remotely and choose whether to wait on-site or return when their turn is approaching. Furthermore, the system is designed to efficiently handle high transaction volumes during peak periods while maintaining a fast, organized, and reliable payment service.
