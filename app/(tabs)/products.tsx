import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/config';
import { useFocusEffect } from '@react-navigation/native';


interface Product {
    id: number;
    name: string;
    image: string;
    thumbnail: string;
    price: number;
    qty: number;
    brand: { id: number; name: string };
    color: { id: number; name: string };
    size: { id: number; name: string };

}

export default function ProductScreen() {
    const router = useRouter();
    const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string, categoryName: string }>();
    const [products, setProducts] = useState<Product[]>([]);
    const [menuVisible, setMenuVisible] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userName'); // Eliminar el nombre del usuario al cerrar sesión
        router.replace('/login'); // Vuelve a la pantalla de login
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
    useFocusEffect(
        useCallback(() => {
            fetchCartCount();
        }, [])
    );

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                console.log('Token recuperado:', token);

                if (!token) {
                    console.error('Token no disponible, redirigiendo a login');
                    router.replace('/login');
                    return;
                }

                const response = await axios.get(`http://localhost:8000/api/user/categories/${categoryName}/products`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log('Productos recibidos:', response.data.products);
                setProducts(response.data.products);
            } catch (error) {
                console.error('Error al obtener productos:', error);
            }
        };

        if (categoryId && categoryName) {
            fetchProducts();
            fetchCartCount();
        }
    }, [categoryId, categoryName, router]);

    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Productos</Text>

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
                    {/* Puedes agregar más opciones aquí */}
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Otra Opción</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.productsContainer}>
                    {products.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.productCard}
                            onPress={() =>
                                router.push({
                                    pathname: '/productdetail',
                                    params: {
                                        id: item.id,
                                        name: item.name,
                                        image: item.image,
                                        brand: item.brand?.name ?? 'Sin marca',
                                        size: item.size?.name ?? 'Sin talla',
                                        color: item.color?.name ?? 'Sin color',
                                        qty: item.qty,
                                        price: item.price,
                                    },
                                })
                            }>
                            <Image
                                source={{ uri: `http://localhost:8000/storage/${item.image}` }}
                                style={styles.productImage}
                                resizeMode="cover"
                            />
                            <Text style={styles.productName}>{item.name}</Text>
                            <Text style={styles.productPrice}>${item.price}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
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

    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    iconButton: {
        position: 'absolute',
        top: 19,
        right: 56,
        zIndex: 1000,
        padding: 10,
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
    productsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 10, // si usas React Native 0.71+
        marginTop: 40,
    },
    productList: {
        paddingTop: 50, // para que el menú no cubra los productos
        paddingBottom: 30,
        justifyContent: 'center',
    },
    productCard: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        margin: 10,
        borderRadius: 10,
        width: Dimensions.get('window').width * 0.8,
        height: 300,
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: '85%',
        marginBottom: 10,
        borderRadius: 5,
    },
    productName: {
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    productPrice: {
        color: 'green',
        fontSize: 14,
    },
    scrollContent: {
        paddingBottom: 40,
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
});