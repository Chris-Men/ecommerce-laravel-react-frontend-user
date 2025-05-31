import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Image, Dimensions, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/config';
import { useFocusEffect } from '@react-navigation/native';

// Definición de la interfaz Category
interface Category {
    id: number;
    name: string;
    image: string;
}

export default function HomeScreen() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

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
        const fetchUserName = async () => {
            const name = await AsyncStorage.getItem('userName');
            if (name) {
                setUserName(name);
            } else {
                console.log('No se encontró el nombre del usuario en AsyncStorage'); // Ayuda a depurar
            }
        };

        const fetchCategories = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                console.log('Token recuperado:', token);

                if (!token) {
                    console.error('Token no disponible, redirigiendo a login');
                    router.replace('/login');
                    return;
                }

                const response = await axios.get("http://localhost:8000/api/user/categories", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log('Respuesta de categorías:', response.data); // Verifica la respuesta
                setCategories(response.data.categories);
                console.log('Categorías guardadas en el estado:', response.data); // Verifica el estado
            } catch (error) {
                console.error('Error al obtener categorías:', error);
            }
        };

        fetchUserName();
        fetchCategories();
    }, [router]);

    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    const handleCategoryPress = (category: Category) => {
        console.log('Categoría seleccionada:', category);
        // Aquí puedes navegar a otra pantalla o realizar otra acción
        router.push({ pathname: '/products', params: { categoryId: category.id.toString(), categoryName: category.name } });
    };

    const filteredCategories = categories
        .filter(category =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));


    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.header}>
                {/* Navbar */}
                <ThemedView style={styles.navbar}>
                    <ThemedText type="title" style={styles.welcomeText}>
                        ¡Bienvenido {userName}!
                    </ThemedText>
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
                </ThemedView>
            </ThemedView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ThemedView style={{ marginVertical: 50 }}>
                    <TextInput
                        placeholder="Buscar categorías..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, { marginBottom: -40 }]}
                    />
                </ThemedView>

                {/* Lista de categorías */}
                <View style={styles.categoriesContainer}>
                    {filteredCategories.map((item) => (
                        <TouchableOpacity key={item.id} onPress={() => handleCategoryPress(item)}>
                            <View style={styles.categoryCard}>
                                <Image
                                    source={{ uri: `http://localhost:8000/storage/${item.image}` }}
                                    style={styles.categoryImage}
                                    resizeMode="cover"
                                />
                                <Text style={styles.categoryName}>{item.name}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start', // Cambia a flex-start para que la lista esté en la parte superior
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF', // Establecer el fondo blanco
    },
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
    
    iconButton: {
        position: 'absolute',
        right: 40,
        zIndex: 1000,
        padding: 10,
        top: 10,
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        flex: 1,
        alignItems: 'center',
    },
    welcomeText: {
        flex: 1,
        textAlign: 'left',
        color: '#000', // Cambia el color según sea necesario
        fontSize: 24,
        top: 5,
    },
    menuButton: {
        padding: 10,
    },
    menuButtonText: {
        color: '#000', // Cambia el color según sea necesario
        fontSize: 24,
        top: 5,
    },
    dropdownMenu: {
        position: 'absolute',
        right: 0,
        top: 40,
        backgroundColor: 'white',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    menuItem: {
        padding: 10,
    },
    menuItemText: {
        color: '#000',
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10, // opcional si usas React Native v0.71+
        marginTop: 5,
    },
    categoryCard: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        margin: 10,
        borderRadius: 10,
        width: Dimensions.get('window').width * 0.8, // Asegúrate que no supere el 50% para que se acomoden dos por fila
        height: 300,
        alignItems: 'center',
    },
    categoryImage: {
        width: '100%', // Ancho responsivo de la imagen
        height: '85%', // Altura responsiva de la imagen
        marginBottom: 10, // Espacio entre la imagen y el nombre
        borderRadius: 5,
    },
    categoryName: {
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center', // Centrar el texto
    },
    linkText: {
        padding: 10,
        fontSize: 16,
        color: '#007bff',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 20,
        width: '100%',
        borderRadius: 5,
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