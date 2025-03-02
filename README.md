# TheCrypto.Wiki

A comprehensive and user-friendly iOS/Android app built with Expo, providing educational resources and tools for cryptocurrency beginners.

## Demo

![Desktop Demo](./assets/Screenshots/Banner.jpg "Desktop Demo")

<p align="center">
  <a href="https://thecrypto.wiki"><strong>➥ Live Demo</strong></a>
</p>

## Overview

TheCrypto.Wiki is designed to help newcomers navigate the complex world of cryptocurrency through easy-to-understand educational content. The app offers beginner-friendly guides, cryptocurrency basics, investment tips, security practices, and practical tools to help users start their crypto journey with confidence.

## Key Features

- **Educational Guides:** Step-by-step tutorials and explanations of cryptocurrency fundamentals.
- **Crypto Glossary:** Comprehensive dictionary of cryptocurrency terms and concepts.
- **Investment Basics:** Introduction to crypto trading, portfolio management, and risk assessment.
- **Security Tips:** Essential information about wallet safety, scam prevention, and best practices.
- **Tools & Calculators:** Practical tools for crypto conversions, profit calculations, and portfolio tracking.
- **Push Notifications:** Stay informed with market updates and educational content, powered by Firebase.

## Technologies

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Push Notifications:** Firebase Cloud Messaging
- **UI Components:** React Native Elements and other React Native libraries
- **Backend:** Firebase
- **Deployment:** Expo managed workflow for seamless iOS/Android distribution

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or above)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/) installed globally:
  ```bash
  npm install -g expo-cli
  ```
- A Firebase project configured for push notifications

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/tinnitus-app.git
   cd tinnitus-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file based on the provided example (if available) and add your Firebase configuration and other necessary keys.

### Running the App

Start the Expo development server with:

```bash
expo start
```

Then, use the Expo Go app on your mobile device or an emulator to run the project.

### Building for Production

To create standalone builds for iOS and Android, follow the Expo documentation:

- [Building Standalone Apps with Expo](https://docs.expo.dev/build/introduction/)

## Push Notifications Setup

This app uses Firebase Cloud Messaging for push notifications. Ensure that you:

- Set up a Firebase project and enable Cloud Messaging.
- Update your Firebase configuration in your project.
- Follow Expo's guidelines for configuring push notifications: [Using Push Notifications](https://docs.expo.dev/push-notifications/overview/).

## License

This project is provided for viewing purposes only. All rights are reserved. No part of this project may be copied, modified, or redistributed without explicit written permission from the author.
