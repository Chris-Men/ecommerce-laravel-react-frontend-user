import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';


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

            const response = await axios.get('http://localhost:8000/api/cart', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('Contenido del carrito:', response.data);

            const items = response.data;
            const totalQty = items.reduce((sum: number, item: any) => sum + item.qty, 0);
            setCartCount(totalQty);
        } catch (error) {
            console.error('Error al obtener el carrito:', error);
        }
    };


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
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

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
                                        thumbnail: item.thumbnail,
                                        brand: item.brand?.name ?? 'Sin marca',
                                        size: item.size?.name ?? 'Sin talla',
                                        color: item.color?.name ?? 'Sin color',
                                        qty: item.qty,
                                        price: item.price,
                                    },
                                })
                            }>
                            <Image
                                source={{ uri: `http://localhost:8000/storage/products/${item.thumbnail}` }}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: -20,
        marginBottom: 10,
        zIndex: 10,
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
        top: 15,
        right: 50,
        zIndex: 1000,
        padding: 10,
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
        padding: 15,
        margin: 10,
        borderRadius: 5,
        width: Dimensions.get('window').width * 0.4,
        height: 300,
        alignItems: 'center',
    },
    productImage: {
        width: '80%',
        height: '70%',
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
        marginTop: 5,
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