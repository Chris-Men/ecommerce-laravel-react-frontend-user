import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userName'); // Eliminar el nombre del usuario al cerrar sesión
        router.replace('/login'); // Vuelve a la pantalla de login
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
        }
    }, [categoryId, categoryName, router]);

    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
                {/* <Text style={styles.title}>Productos de la categoría: {categoryName}</Text> */}
                <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
                    <Text style={styles.menuButtonText}>☰</Text>
                </TouchableOpacity>
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
                                source={{ uri: `http://localhost:8000/storage/${item.thumbnail}` }}
                                style={styles.productImage}
                                resizeMode="cover"
                            />
                            <Text style={styles.productName}>{item.name}</Text>
                            <Text style={styles.productPrice}>${item.price}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
});