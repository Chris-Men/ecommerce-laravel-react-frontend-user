import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios, { isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Picker } from '@react-native-picker/picker';

// Definir los tipos
interface ProductDetail {
    id: string;
    name: string;
    image: string;
    qty: number;
    price: number;
    brand?: { name: string };
    size?: { name: string };
    color?: { name: string };
}

export default function ProductDetailScreen() {
    const { id, name, image, brand, size, color, qty, price } = useLocalSearchParams();
    const [quantity, setQuantity] = useState('1');
    const [menuVisible, setMenuVisible] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [productDetails, setProductDetails] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(false);

    // Debug: Ver qué datos están llegando
    console.log('Parámetros recibidos:', { id, name, image, brand, size, color, qty, price });

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userName');
        router.replace('/login');
    };

    const fetchCartCount = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await axios.get("http://localhost:8000/api/cart", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const items = response.data;
            const totalQty = items.reduce((sum: number, item: any) => sum + item.qty, 0);
            setCartCount(totalQty);
        } catch (error) {
            console.error('Error al obtener el carrito:', error);
        }
    };

    // Nueva función para obtener detalles completos del producto
    const fetchProductDetails = async () => {
        if (!id) return;
        
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`http://localhost:8000/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Detalles del producto desde API:', response.data);
            const productData = response.data.data || response.data;
            setProductDetails(productData);
        } catch (error) {
            console.error('Error al obtener detalles del producto:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCartCount();
            fetchProductDetails(); // Obtener detalles completos del producto
        }, [])
    );

    const handleAddToCart = async () => {
        console.log('Intentando agregar al carrito...');

        if (Number(quantity) > Number(productDetails?.qty || qty)) {
            Alert.alert('Cantidad no disponible', `Solo hay ${productDetails?.qty || qty} en inventario`);
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

            const response = await axios.post("http://localhost:8000/api/cart", payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            console.log('Respuesta del backend:', response.data);

            if (response.status === 200 || response.status === 201) {
                setMenuVisible(false);
                console.log('Mostrando alerta de agregado al carrito');
                Toast.show({
                    type: 'custom',
                    text1: 'Agregado al carrito',
                    text2: `${name} x ${quantity}`,
                    position: 'top',
                    visibilityTime: 2000,
                    autoHide: true,
                });

                await fetchCartCount();
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
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Detalles</Text>

                <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconButton}>
                    <Ionicons name="cart-outline" size={24} color="#000" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
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
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Otra Opción</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            <Image 
                source={{ uri: `http://localhost:8000/storage/${image}` }} 
                style={styles.image} 
                onError={(e) => console.log('Error cargando imagen:', e.nativeEvent.error)}
            />
            <Text style={styles.name}>{productDetails?.name || name || 'Sin nombre'}</Text>
            
            {loading ? (
                <Text style={styles.detail}>Cargando detalles...</Text>
            ) : (
                <>
                    {/* Usar los datos de la API si están disponibles, sino usar los parámetros */}
                    {(productDetails?.brand?.name || brand) && (
                        <Text style={styles.detail}>Marca: {productDetails?.brand?.name || brand}</Text>
                    )}
                    {(productDetails?.size?.name || size) && (
                        <Text style={styles.detail}>Talla: {productDetails?.size?.name || size}</Text>
                    )}
                    {(productDetails?.color?.name || color) && (
                        <Text style={styles.detail}>Color: {productDetails?.color?.name || color}</Text>
                    )}
                    
                    <Text style={styles.detail}>Disponibles: {productDetails?.qty || qty || 0}</Text>
                    <Text style={styles.detail}>Precio: ${productDetails?.price || price || 0}</Text>
                </>
            )}

            <Picker
                selectedValue={quantity}
                style={styles.picker}
                onValueChange={(itemValue) => setQuantity(itemValue)}
                enabled={!loading}
            >
                {Array.from({ length: Number(productDetails?.qty || qty || 0) }, (_, i) => (
                    <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} />
                ))}
            </Picker>

            <TouchableOpacity style={styles.button} onPress={handleAddToCart}>
                <Text style={styles.buttonText}>Agregar al carrito</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: -10,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTitle: {
        position: 'absolute',
        top: 25,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    backButton: {
        padding: 10,
        position: 'absolute',
        top: 19,
        left: 10,
        zIndex: 1000,
    },
    menuButton: {
        position: 'absolute',
        top: 10,
        right: 12,
        zIndex: 1000,
        padding: 14,
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
        height: 300,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 55,
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
    cartBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'red',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 1,
        minWidth: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    iconButton: {
        position: 'absolute',
        top: 19,
        right: 56,
        zIndex: 1000,
        padding: 10,
    },
    picker: {
        height: 50,
        width: '40%',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
        marginTop: 10,
        paddingLeft: 5,
    },
});