import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios, { isAxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
            {/* Header fijo */}
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

            {/* Menú desplegable */}
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

            {/* Contenido desplazable */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
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

                <View style={styles.quantitySection}>
                    <Text style={styles.quantityLabel}>Cantidad:</Text>
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
                </View>

                <TouchableOpacity style={styles.button} onPress={handleAddToCart}>
                    <Text style={styles.buttonText}>Agregar al carrito</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
  // === HEADER STYLES ===
  header: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  
  headerTitle: {
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  
  // === NAVIGATION BUTTONS ===
  backButton: {
    position: 'absolute',
    top: 19,
    left: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    zIndex: 1000,
  },
  
  menuButton: {
    position: 'absolute',
    top: 10,
    right: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    zIndex: 1000,
  },
  
  menuButtonText: {
    fontSize: 20,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  
  iconButton: {
    position: 'absolute',
    top: 19,
    right: 56,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    zIndex: 1000,
  },
  
  // === DROPDOWN MENU ===
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 160,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  
  // === MAIN CONTAINER ===
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // === SCROLL VIEW STYLES ===
  scrollView: {
    flex: 1,
    marginTop: 60, // Espacio para el header fijo
  },
  
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Espacio extra al final
  },
  
  // === CONTENT STYLES ===
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    lineHeight: 30,
  },
  
  detail: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: '400',
  },
  
  // === QUANTITY SECTION ===
  quantitySection: {
    marginVertical: 16,
  },
  
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  
  // === BUTTONS ===
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // === CART BADGE ===
  cartBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  
  // === FORM ELEMENTS ===
  picker: {
    height: 50,
    width: '100%',
    borderColor: '#e9ecef',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#495057',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});