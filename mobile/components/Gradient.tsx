import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface GradientProps {
    colors: string[];
    style?: any;
    children?: React.ReactNode;
}

/**
 * Cross-platform gradient component.
 * Uses expo-linear-gradient on native, falls back to View on web.
 */
export default function Gradient({ colors: gradientColors, style, children }: GradientProps) {
    if (Platform.OS === 'web') {
        // CSS gradient fallback for web
        return (
            <View
                style={[
                    style,
                    {
                        background: `linear-gradient(180deg, ${gradientColors.join(', ')})`,
                    } as any,
                ]}
            >
                {children}
            </View>
        );
    }

    // Native: use expo-linear-gradient
    const { LinearGradient } = require('expo-linear-gradient');
    return (
        <LinearGradient colors={gradientColors} style={style}>
            {children}
        </LinearGradient>
    );
}
