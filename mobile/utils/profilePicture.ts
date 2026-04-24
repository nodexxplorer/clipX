// mobile/utils/profilePicture.ts
// Section 11: Profile picture upload utility with image picker + Cloudinary upload
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Request camera/gallery permissions
 */
async function requestPermissions(source: 'camera' | 'gallery'): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed to take a profile photo.');
            return false;
        }
    } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Photo library access is needed to select a profile picture.');
            return false;
        }
    }
    return true;
}

/**
 * Launch the image picker and return selected image URI
 */
export async function pickProfileImage(source: 'camera' | 'gallery' = 'gallery'): Promise<string | null> {
    const hasPermission = await requestPermissions(source);
    if (!hasPermission) return null;

    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
    };

    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
    } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];

    // File size check
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        Alert.alert('File Too Large', 'Please select an image under 5MB.');
        return null;
    }

    return asset.uri;
}

/**
 * Upload image to backend (which proxies to Cloudinary/S3)
 */
export async function uploadProfilePicture(imageUri: string): Promise<UploadResult> {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            return { success: false, error: 'Not authenticated' };
        }

        // Create multipart form data
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
            uri: imageUri,
            name: filename,
            type,
        } as any);

        const response = await fetch(`${API_URL}/api/upload/avatar`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: errText || 'Upload failed' };
        }

        const data = await response.json();
        return {
            success: true,
            url: data.url || data.avatar_url,
        };
    } catch (error: any) {
        console.error('Profile picture upload error:', error);
        return { success: false, error: error.message || 'Network error during upload' };
    }
}

/**
 * Show action sheet to pick camera or gallery, then upload
 */
export function showImagePickerOptions(
    onUploadStart: () => void,
    onUploadComplete: (result: UploadResult) => void
) {
    Alert.alert(
        'Change Profile Photo',
        'Choose how you want to update your profile picture',
        [
            {
                text: 'Take Photo',
                onPress: async () => {
                    const uri = await pickProfileImage('camera');
                    if (!uri) return;
                    onUploadStart();
                    const result = await uploadProfilePicture(uri);
                    onUploadComplete(result);
                },
            },
            {
                text: 'Choose from Library',
                onPress: async () => {
                    const uri = await pickProfileImage('gallery');
                    if (!uri) return;
                    onUploadStart();
                    const result = await uploadProfilePicture(uri);
                    onUploadComplete(result);
                },
            },
            {
                text: 'Cancel',
                style: 'cancel',
            },
        ]
    );
}
