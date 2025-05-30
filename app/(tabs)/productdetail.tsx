import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { isAxiosError } from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '@/constants/config';



export default function ProductDetailScreen() {
    const { id, name, thumbnail, brand, size, color, qty, price } = useLocalSearchParams();
    const [quantity, setQuantity] = useState('1');
    const [menuVisible, setMenuVisible] = useState(false);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userName'); // Eliminar el nombre del usuario al cerrar sesión
        router.replace('/login'); // Vuelve a la pantalla de login
    };

    const handleAddToCart = async () => {
        console.log('Intentando agregar al carrito...');

        if (Number(quantity) > Number(qty)) {
            Alert.alert('Cantidad no disponible', `Solo hay ${qty} en inventario`);
            console.log('Cantidad solicitada mayor al inventario');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            console.log('Token obtenido:', token);

            const payload = {
                product_id: id,
                qty: Number(quantity),
            };

            console.log('Datos enviados al backend:', payload);

            const response = await axios.post(`${API_BASE_URL}/cart`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            console.log('Respuesta del backend:', response.data);

            if (response.status === 200 || response.status === 201) {
                setMenuVisible(false); // Asegúrate de cerrar el menú
                console.log('Mostrando alerta de agregado al carrito');
                Toast.show({
                    type: 'custom',
                    text1: 'Agregado al carrito',
                    text2: `${name} x ${quantity}`,
                    position: 'top', // Usa top, pero en el componente lo centramos
                    visibilityTime: 2000, // 2 segundos
                    autoHide: true,
                });
            }
        } catch (error) {
            if (isAxiosError(error) && error.response) {
                console.log('Error en la respuesta de Axios:', error.response.data);
                Alert.alert('Error', error.response.data.message || 'No se pudo agregar al carrito');
            } else {
                console.log('Error desconocido:', error);
                Alert.alert('Error', 'Error de red o del servidor');
            }
        }
    };

    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/products')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                    <Text style={styles.menuButtonText}>☰</Text>
                </TouchableOpacity>
            </View>

            {menuVisible && (
                <View style={styles.dropdownMenu}>
                    <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                    {/* Puedes agregar más opciones aquí */}
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Otra Opción</Text>
                    </TouchableOpacity>
                </View>
            )}
            <Image source={{ uri: `${API_BASE_URL.replace('/api', '')}/storage/products/${thumbnail}` }} style={styles.image} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.detail}>Marca: {brand}</Text>
            <Text style={styles.detail}>Talla: {size}</Text>
            <Text style={styles.detail}>Color: {color}</Text>
            <Text style={styles.detail}>Disponibles: {qty}</Text>
            <Text style={styles.detail}>Precio: ${price}</Text>

            <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Cantidad"
            />

            <TouchableOpacity style={styles.button} onPress={handleAddToCart}>
                <Text style={styles.buttonText}>Agregar al carrito</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: -20,
        marginBottom: 10,
    },

    backButton: {
        padding: 10,
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
    },

    backButtonText: {
        fontSize: 24,
        color: '#000',
    },
    menuButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        padding: 10,
    },
    menuButtonText: {
        fontSize: 24,
        color: '#000',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 50,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1001,
    },
    menuItem: {
        padding: 10,
    },
    menuItemText: {
        color: '#000',
    },
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flex: 1,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 75,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    detail: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginTop: 10,
        marginBottom: 20,
        width: '40%',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});