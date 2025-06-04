import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ImagePickerResponse, launchImageLibrary, MediaType } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

type User = {
    id: number;
    name: string;
    email: string;
    address?: string;
    city?: string;
    zip_code?: string;
    country?: string;
    phone_number?: string;
    profile_image?: string;
    profile_completed: boolean;
    role: string;
    image_path: string;
    created_at: string;
};

type ProfileStatus = {
    completed: boolean;
    percentage: number;
    missing_fields: string[];
};

type UserProfileData = {
    user: User;
    profile_status: ProfileStatus;
};

const API_URL = 'http://localhost:8000/api';

export default function UserProfileScreen() {
    const [userData, setUserData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados para edición de perfil
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        zip_code: '',
        country: '',
        phone_number: ''
    });

    // Estados para cambio de contraseña
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });

    const showSuccessMessage = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Calcular estado del perfil localmente
    const calculateProfileStatus = (user: User): ProfileStatus => {
        const requiredFields = ['name', 'email', 'phone_number', 'address', 'city', 'zip_code', 'country'];
        const missingFields: string[] = [];
        
        requiredFields.forEach(field => {
            if (!user[field as keyof User] || user[field as keyof User] === '') {
                missingFields.push(field);
            }
        });

        const completedFields = requiredFields.length - missingFields.length;
        const percentage = Math.round((completedFields / requiredFields.length) * 100);

        return {
            completed: missingFields.length === 0,
            percentage,
            missing_fields: missingFields
        };
    };

    // Obtener datos del perfil
    const fetchUserProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                // Ajustar estructura de datos del controlador
                const profileStatus = calculateProfileStatus(data.user);
                const userData = {
                    user: {
                        ...data.user,
                        image_path: data.image_path
                    },
                    profile_status: profileStatus
                };
                setUserData(userData);
                
                // Llenar formulario de edición con datos actuales
                setEditForm({
                    name: data.user.name || '',
                    email: data.user.email || '',
                    address: data.user.address || '',
                    city: data.user.city || '',
                    zip_code: data.user.zip_code || '',
                    country: data.user.country || '',
                    phone_number: data.user.phone_number || ''
                });
            } else {
                Alert.alert('Error', 'Error al obtener datos del perfil');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'No se pudo cargar el perfil');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Actualizar perfil
const updateProfile = async () => {
    try {
        console.log('=== DEBUGGING UPDATE PROFILE ===');
        console.log('1. Datos del formulario:', editForm);
        
        const token = await AsyncStorage.getItem('token');
        console.log('2. Token existe:', !!token);
        
        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json', 
            },
            body: JSON.stringify(editForm), 
        });

        console.log('3. Status de respuesta:', response.status);
        
        const data = await response.json(); 
        console.log('4. Respuesta del servidor:', data);
        
        if (response.ok) {
            // Actualizar datos locales
            const updatedProfileStatus = calculateProfileStatus(data.user);
            const updatedUserData = {
                user: {
                    ...data.user,
                    image_path: data.image_path
                },
                profile_status: updatedProfileStatus
            };
            
            setUserData(updatedUserData);
            setEditModalVisible(false);
            showSuccessMessage(data.message || 'Perfil actualizado correctamente');
            
            console.log(' Perfil actualizado exitosamente');
        } else {
            console.log(' Error en respuesta:', data);
            Alert.alert('Error', data.message || 'Error al actualizar perfil');
        }
        
    } catch (error) {
        console.error(' Error updating profile:', error);
        Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
};

const updateProfileWithFormData = async () => {
    try {
        console.log('=== DEBUGGING UPDATE PROFILE (FormData) ===');
        console.log('1. Datos del formulario:', editForm);
        
        const token = await AsyncStorage.getItem('token');
        
        const formData = new FormData();
        
        // Agregar solo campos que no estén vacíos
        Object.keys(editForm).forEach(key => {
            const value = editForm[key as keyof typeof editForm];
            if (value && value.trim() !== '') {
                formData.append(key, value.trim());
                console.log(`Agregando ${key}:`, value);
            }
        });

        console.log('2. FormData entries:');
        for (let [key, value] of formData._parts) {
            console.log(`${key}: ${value}`);
        }

        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            body: formData,
        });

        console.log('3. Status de respuesta:', response.status);
        
        const data = await response.json();
        console.log('4. Respuesta del servidor:', data);
        
        if (response.ok) {

            const updatedProfileStatus = calculateProfileStatus(data.user);
            const updatedUserData = {
                user: {
                    ...data.user,
                    image_path: data.image_path
                },
                profile_status: updatedProfileStatus
            };
            
            setUserData(updatedUserData);
            setEditModalVisible(false);
            showSuccessMessage(data.message || 'Perfil actualizado correctamente');
            
        } else {
            Alert.alert('Error', data.message || 'Error al actualizar perfil');
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
};

    // Cambiar contraseña 
    const changePassword = async () => {
        if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/change-password`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passwordForm),
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordModalVisible(false);
                setPasswordForm({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: ''
                });
                showSuccessMessage('Contraseña actualizada correctamente');
            } else {
                Alert.alert('Error', data.message || 'Error al cambiar contraseña');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            Alert.alert('Error', 'No se pudo cambiar la contraseña');
        }
    };

    // Subir imagen de perfil
    const uploadProfileImage = () => {
        const options = {
            mediaType: 'photo' as MediaType,
            quality: 0.8,
            maxWidth: 500,
            maxHeight: 500,
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel || response.errorMessage) return;

            const asset = response.assets?.[0];
            if (!asset?.uri) return;

            uploadImageToServer(asset);
        });
    };

const uploadImageToServer = async (asset: any) => {
    setUploadingImage(true);
    try {
        console.log('=== DEBUGGING IMAGE UPLOAD ===');
        console.log('1. Asset info:', {
            uri: asset.uri,
            type: asset.type,
            fileName: asset.fileName
        });
        
        const token = await AsyncStorage.getItem('token');
        const formData = new FormData();
        
        formData.append('profile_image', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'profile.jpg',
        } as any);

        console.log('2. Enviando imagen...');

        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            body: formData,
        });

        console.log('3. Status de respuesta:', response.status);
        
        const data = await response.json(); 
        console.log('4. Respuesta:', data);

        if (response.ok) {
            await fetchUserProfile(); // Recargar datos
            showSuccessMessage(data.message || 'Imagen actualizada correctamente');
            console.log(' Imagen subida exitosamente');
        } else {
            console.log(' Error:', data);
            Alert.alert('Error', data.message || 'Error al subir imagen');
        }
    } catch (error) {
        console.error(' Error uploading image:', error);
        Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
        setUploadingImage(false);
    }
};

    // Eliminar imagen de perfil
    const deleteProfileImage = () => {
        Alert.alert(
            'Confirmar',
            '¿Estás seguro de que quieres eliminar tu imagen de perfil?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: performDeleteImage }
            ]
        );
    };

    const performDeleteImage = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/remove-profile-image`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                fetchUserProfile(); // Recargar datos
                showSuccessMessage(data.message);
            } else {
                Alert.alert('Error', data.message || 'Error al eliminar imagen');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            Alert.alert('Error', 'No se pudo eliminar la imagen');
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserProfile();
    }, []);

    const getCompletionColor = (percentage: number) => {
        if (percentage >= 80) return '#4CAF50';
        if (percentage >= 50) return '#FF9800';
        return '#F44336';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4e8cff" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error al cargar el perfil</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { user, profile_status } = userData;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Success Message */}
                {successMessage && (
                    <View style={styles.successMessageContainer}>
                        <Text style={styles.successMessageText}>{successMessage}</Text>
                    </View>
                )}

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mi Perfil</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setEditModalVisible(true)}
                    >
                        <Text style={styles.editButtonText}>✏ Editar</Text>
                    </TouchableOpacity>
                </View>

                {/* Profile Image Section */}
                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: user.image_path }}
                            style={styles.profileImage}
                        />
                        {uploadingImage && (
                            <View style={styles.imageOverlay}>
                                <ActivityIndicator size="small" color="white" />
                            </View>
                        )}
                    </View>
                    <View style={styles.imageButtons}>
                        <TouchableOpacity
                            style={styles.imageButton}
                            onPress={uploadProfileImage}
                            disabled={uploadingImage}
                        >
                            <Text style={styles.imageButtonText}>📷 Cambiar</Text>
                        </TouchableOpacity>
                        {user.profile_image && (
                            <TouchableOpacity
                                style={[styles.imageButton, styles.deleteButton]}
                                onPress={deleteProfileImage}
                            >
                                <Text style={styles.deleteButtonText}>🗑 Eliminar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Profile Completion */}
                <View style={styles.completionSection}>
                    <View style={styles.completionHeader}>
                        <Text style={styles.completionTitle}>Completado del Perfil</Text>
                        <Text style={styles.completionPercentage}>
                            {profile_status.percentage}%
                        </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View
                            style={[
                                styles.progressBar,
                                {
                                    width: `${profile_status.percentage}%`,
                                    backgroundColor: getCompletionColor(profile_status.percentage)
                                }
                            ]}
                        />
                    </View>
                    {profile_status.missing_fields.length > 0 && (
                        <View style={styles.missingFields}>
                            <Text style={styles.missingFieldsTitle}>Campos faltantes:</Text>
                            {profile_status.missing_fields.map((field, index) => (
                                <Text key={index} style={styles.missingField}>• {field}</Text>
                            ))}
                        </View>
                    )}
                </View>

                {/* User Information */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Información Personal</Text>
                    
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Nombre</Text>
                        <Text style={styles.infoValue}>{user.name}</Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user.email}</Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Rol</Text>
                        <Text style={[styles.infoValue, styles.roleValue]}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Teléfono</Text>
                        <Text style={styles.infoValue}>
                            {user.phone_number || 'No especificado'}
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Miembro desde</Text>
                        <Text style={styles.infoValue}>{formatDate(user.created_at)}</Text>
                    </View>
                </View>

                {/* Address Information */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Dirección</Text>
                    
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Dirección</Text>
                        <Text style={styles.infoValue}>
                            {user.address || 'No especificada'}
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Ciudad</Text>
                        <Text style={styles.infoValue}>
                            {user.city || 'No especificada'}
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Código Postal</Text>
                        <Text style={styles.infoValue}>
                            {user.zip_code || 'No especificado'}
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>País</Text>
                        <Text style={styles.infoValue}>
                            {user.country || 'No especificado'}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.passwordButton}
                        onPress={() => setPasswordModalVisible(true)}
                    >
                        <Text style={styles.passwordButtonText}>🔒 Cambiar Contraseña</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Editar Perfil</Text>

                            <Text style={styles.label}>Nombre</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.name}
                                onChangeText={(text) => setEditForm({...editForm, name: text})}
                                placeholder="Tu nombre completo"
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.email}
                                onChangeText={(text) => setEditForm({...editForm, email: text})}
                                placeholder="tu@email.com"
                                keyboardType="email-address"
                            />

                            <Text style={styles.label}>Teléfono</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.phone_number}
                                onChangeText={(text) => setEditForm({...editForm, phone_number: text})}
                                placeholder="Tu número de teléfono"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Dirección</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.address}
                                onChangeText={(text) => setEditForm({...editForm, address: text})}
                                placeholder="Tu dirección completa"
                            />

                            <Text style={styles.label}>Ciudad</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.city}
                                onChangeText={(text) => setEditForm({...editForm, city: text})}
                                placeholder="Tu ciudad"
                            />

                            <Text style={styles.label}>Código Postal</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.zip_code}
                                onChangeText={(text) => setEditForm({...editForm, zip_code: text})}
                                placeholder="12345"
                            />

                            <Text style={styles.label}>País</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.country}
                                onChangeText={(text) => setEditForm({...editForm, country: text})}
                                placeholder="Tu país"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setEditModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={updateProfile}
                                >
                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                visible={passwordModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setPasswordModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

                        <Text style={styles.label}>Contraseña Actual</Text>
                        <TextInput
                            style={styles.input}
                            value={passwordForm.current_password}
                            onChangeText={(text) => setPasswordForm({...passwordForm, current_password: text})}
                            placeholder="Tu contraseña actual"
                            secureTextEntry
                        />

                        <Text style={styles.label}>Nueva Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            value={passwordForm.new_password}
                            onChangeText={(text) => setPasswordForm({...passwordForm, new_password: text})}
                            placeholder="Nueva contraseña (mín. 6 caracteres)"
                            secureTextEntry
                        />

                        <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            value={passwordForm.new_password_confirmation}
                            onChangeText={(text) => setPasswordForm({...passwordForm, new_password_confirmation: text})}
                            placeholder="Confirma tu nueva contraseña"
                            secureTextEntry
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setPasswordModalVisible(false);
                                    setPasswordForm({
                                        current_password: '',
                                        new_password: '',
                                        new_password_confirmation: ''
                                    });
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={changePassword}
                            >
                                <Text style={styles.saveButtonText}>Cambiar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#4e8cff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    successMessageContainer: {
        backgroundColor: '#d4edda',
        borderColor: '#c3e6cb',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    successMessageText: {
        color: '#155724',
        fontSize: 14,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        backgroundColor: '#4e8cff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    editButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#4e8cff',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    imageButton: {
        backgroundColor: '#4e8cff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    imageButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    completionSection: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    completionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    completionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    completionPercentage: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4e8cff',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginBottom: 10,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    missingFields: {
        marginTop: 10,
    },
    missingFieldsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    missingField: {
        fontSize: 13,
        color: '#666',
        marginLeft: 10,
    },
    infoSection: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 8,
    },
    infoItem: {
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
    },
    roleValue: {
        fontWeight: '600',
    },
    actionButtons: {
        marginBottom: 20,
    },
    passwordButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    passwordButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: width * 0.9,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
        marginBottom: 5,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#6c757d',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#4e8cff',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});