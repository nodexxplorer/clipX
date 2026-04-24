// mobile/hooks/useResponsiveLayout.ts
// Section 18: Tablet/iPad native layout — dynamic column routing
import { useState, useEffect, useCallback } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

export type DeviceType = 'phone' | 'tablet';
export type Orientation = 'portrait' | 'landscape';

export interface ResponsiveLayout {
    /** Current device type based on screen width */
    deviceType: DeviceType;
    /** Current orientation */
    orientation: Orientation;
    /** Whether the device is a tablet */
    isTablet: boolean;
    /** Screen width */
    screenWidth: number;
    /** Screen height */
    screenHeight: number;
    /** Number of grid columns for content grids (movies, etc.) */
    gridColumns: number;
    /** Number of rail columns for horizontal rails (home screen) */
    railItemWidth: number;
    /** Content padding for the current layout */
    contentPadding: number;
    /** Whether to show sidebar navigation instead of bottom tabs */
    showSidebar: boolean;
    /** Detail page layout: side-by-side on tablet, stacked on phone */
    detailLayout: 'side-by-side' | 'stacked';
    /** Max content width for readability */
    maxContentWidth: number;
}

const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;

function getLayout(width: number, height: number): ResponsiveLayout {
    const isTablet = width >= TABLET_BREAKPOINT;
    const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;
    const orientation: Orientation = width > height ? 'landscape' : 'portrait';

    let gridColumns: number;
    let railItemWidth: number;
    let contentPadding: number;
    let maxContentWidth: number;

    if (isLargeTablet) {
        // iPad Pro landscape, large tablets
        gridColumns = orientation === 'landscape' ? 6 : 5;
        railItemWidth = width / (orientation === 'landscape' ? 5.5 : 4.5);
        contentPadding = 32;
        maxContentWidth = 1200;
    } else if (isTablet) {
        // Standard iPad/tablet
        gridColumns = orientation === 'landscape' ? 5 : 4;
        railItemWidth = width / (orientation === 'landscape' ? 4.5 : 3.5);
        contentPadding = 24;
        maxContentWidth = 960;
    } else {
        // Phone
        gridColumns = orientation === 'landscape' ? 4 : 3;
        railItemWidth = width / 2.8;
        contentPadding = 16;
        maxContentWidth = width;
    }

    return {
        deviceType: isTablet ? 'tablet' : 'phone',
        orientation,
        isTablet,
        screenWidth: width,
        screenHeight: height,
        gridColumns,
        railItemWidth,
        contentPadding,
        showSidebar: isTablet && orientation === 'landscape',
        detailLayout: isTablet ? 'side-by-side' : 'stacked',
        maxContentWidth,
    };
}

/**
 * Hook that provides responsive layout values based on screen dimensions.
 * Updates automatically on rotation/resize.
 *
 * Usage:
 * ```tsx
 * const { isTablet, gridColumns, contentPadding, detailLayout } = useResponsiveLayout();
 *
 * // In FlatList:
 * <FlatList numColumns={gridColumns} />
 *
 * // For detail pages:
 * <View style={{ flexDirection: detailLayout === 'side-by-side' ? 'row' : 'column' }}>
 * ```
 */
export function useResponsiveLayout(): ResponsiveLayout {
    const [layout, setLayout] = useState<ResponsiveLayout>(() => {
        const { width, height } = Dimensions.get('window');
        return getLayout(width, height);
    });

    const onChange = useCallback(({ window }: { window: ScaledSize }) => {
        setLayout(getLayout(window.width, window.height));
    }, []);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', onChange);
        return () => subscription?.remove();
    }, [onChange]);

    return layout;
}

/**
 * Convenience: get computed card dimensions for grids
 */
export function useCardDimensions(gap: number = 12) {
    const { gridColumns, contentPadding, screenWidth } = useResponsiveLayout();
    const totalGap = gap * (gridColumns - 1);
    const totalPadding = contentPadding * 2;
    const cardWidth = (screenWidth - totalPadding - totalGap) / gridColumns;
    const cardHeight = cardWidth * 1.5; // poster aspect ratio

    return { cardWidth, cardHeight, gridColumns, gap, contentPadding };
}

/**
 * Convenience: get detail page layout values
 */
export function useDetailLayout() {
    const layout = useResponsiveLayout();

    return {
        ...layout,
        posterWidth: layout.isTablet ? 280 : layout.screenWidth,
        infoFlex: layout.isTablet ? 1 : undefined,
        direction: layout.detailLayout === 'side-by-side' ? 'row' as const : 'column' as const,
        gap: layout.isTablet ? 32 : 0,
    };
}
