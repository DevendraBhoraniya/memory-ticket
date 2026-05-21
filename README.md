# Memory Ticket

A premium, cinematic digital scrapbook built with Expo and React Native. Memory Ticket allows you to preserve your favorite moments as beautiful, collectible digital stubs.

![Memory Ticket](https://images.unsplash.com/photo-1516641396056-0ce60a85d49f?q=80&w=1000&auto=format&fit=crop)
*Capture the feeling. Archive your life.*

## Features

- **Cinematic Experience**: Designed with a warm, nostalgic palette, editorial typography, and tactile interactions to evoke the feeling of a physical luxury scrapbook.
- **Offline First**: All memories are stored securely on your device using `AsyncStorage`. No cloud syncing, no accounts required.
- **Data Durability**: Implements a permanent image storage system. Photos are immediately moved from temporary caches to a dedicated app directory (`FileSystem.documentDirectory`), ensuring memories persist even if the OS clears its cache.
- **Export & Share**: Generate high-quality PNG exports of your memory stubs to share with friends or save directly to your native photo gallery.
- **Premium Animations**: Smooth, 60fps layout transitions, floating card effects, and subtle haptics powered by `react-native-reanimated` and `expo-haptics`.
- **First-Class Onboarding**: A curated introduction flow that emotionally connects users with the concept of the app before they create their first ticket.

## Permissions

Memory Ticket follows a **privacy-friendly, contextual permission model**. Permissions are never requested at launch; instead, they are requested "just-in-time" when a specific action requires them:

- **Photo Library (Read)**: Requested only when you tap to select a photo for a new ticket.
- **Photo Library (Write-Only)**: Requested only when you choose to save a ticket to your device's gallery. This uses modern Android granular permissions to avoid unnecessary access to your other media.

Each request is preceded by a contextual explanation to ensure you understand why the access is needed. If permissions are permanently denied, the app provides a simple path to your device settings.

## Architecture

Memory Ticket leverages modern React Native architecture patterns:
- **Routing**: File-based routing with **Expo Router**, ensuring a clean navigation hierarchy (`Splash` → `Onboarding` → `Archive` → `Detail`).
- **State Management**: React Hooks + Context (`OnboardingContext`, `ToastContext`) for lightweight, predictable state distribution.
- **Permissions**: A unified, contextual system (`hooks/use-permissions.ts`) that handles pre-request explanations and graceful fallback states.
- **Storage Layer**: A modular abstraction over `@react-native-async-storage/async-storage` (`utils/storage.ts`) handling all CRUD operations.
- **Export Engine**: Uses `react-native-view-shot` to render off-screen components into high-fidelity images for sharing.

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54) + React Native
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Storage**: AsyncStorage
- **Media/Export**: `expo-image-picker`, `expo-media-library`, `expo-sharing`, `react-native-view-shot`

## Project Structure

```
memory-ticket/
├── app/                  # Expo Router file-based navigation
│   ├── _layout.tsx       # Root layout, Context Providers, Splash handling
│   ├── index.tsx         # The main "Archive" memory wall
│   ├── onboarding.tsx    # Swipeable introduction flow
│   ├── create-ticket.tsx # Storytelling creation interface
│   └── ticket/
│       └── [id].tsx      # Immersive cinematic detail screen
├── components/           # Reusable UI components
│   ├── MemoryTicket.tsx  # The core high-fidelity ticket UI
│   ├── TicketCard.tsx    # Animated wrapper for the Archive grid
│   └── ui/               # Primitives (Icons, ConfirmModal, etc.)
├── constants/            # Design system tokens
│   └── theme.ts          # Palette, Typography, Spacing, Shadows
├── hooks/                # Custom React hooks (useTickets, usePermissions)
├── utils/                # Pure utility functions
│   ├── export.ts         # Image generation and sharing logic
│   └── storage.ts        # AsyncStorage wrappers
└── assets/               # Local static assets
```

## Setup & Installation

### Requirements
- Node.js (>= 18.x)
- Expo CLI
- iOS Simulator or Android Emulator (or a physical device with Expo Go)

### Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/memory-ticket.git
   cd memory-ticket
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on a device:**
   Press `i` to open iOS simulator, `a` to open Android emulator, or scan the QR code with the Expo Go app.

## Known Limitations

- **Local Storage Only**: Currently, deleting the app will permanently delete the collected tickets. Future updates may introduce local backup files.
- **Export Resolution**: The exported image resolution depends on the device's pixel ratio.

## Future Roadmap

- **Collections/Albums**: Organize tickets into specific collections (e.g., "Paris 2024", "Concerts").
- **Cloud Backup**: Optional opt-in to sync tickets to iCloud/Google Drive.
- **Location Auto-fill**: Use EXIF data from selected photos to automatically fill the location and date.

## License

This project is licensed under the MIT License.
