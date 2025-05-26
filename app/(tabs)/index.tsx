import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Image, Dimensions, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userName'); // Eliminar el nombre del usuario al cerrar sesión
        router.replace('/login'); // Vuelve a la pantalla de login
    };

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

                const response = await axios.get('http://localhost:8000/api/user/categories', {
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <ThemedView style={styles.container}>
                <ThemedView style={styles.header}>
                    {/* Navbar */}
                    <ThemedView style={styles.navbar}>
                        <ThemedText type="title" style={styles.welcomeText}>
                            ¡Bienvenido {userName}!
                        </ThemedText>
                        <Link href="/brands"><ThemedText style={styles.linkText}>Brands</ThemedText></Link>
                        <Link href="/categories"><ThemedText style={styles.linkText}>Categories</ThemedText></Link>
                        <Link href="/colors"><ThemedText style={styles.linkText}>Colors</ThemedText></Link>
                        <Link href="/coupons"><ThemedText style={styles.linkText}>Coupons</ThemedText></Link>
                        <Link href="/orders"><ThemedText style={styles.linkText}>Orders</ThemedText></Link>
                        <Link href="/products"><ThemedText style={styles.linkText}>Products</ThemedText></Link>
                        <Link href="/reviews"><ThemedText style={styles.linkText}>Reviews</ThemedText></Link>
                        <Link href="/sizes"><ThemedText style={styles.linkText}>Sizes</ThemedText></Link>
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

                <ThemedView style={{ marginVertical: 60 }}>
                    <TextInput
                        placeholder="Buscar categorías..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, { marginBottom: -30 }]}
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
            </ThemedView>
        </ScrollView >
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
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'dark', // Cambia a 'white' si quieres que el header también sea blanco
        zIndex: 1000,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        paddingLeft: 10,
        color: '#000', // Cambia el color según sea necesario
    },
    menuButton: {
        padding: 10,
    },
    menuButtonText: {
        color: '#000', // Cambia el color según sea necesario
        fontSize: 24,
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
        padding: 15,
        margin: 10,
        borderRadius: 5,
        width: Dimensions.get('window').width * 0.4, // Asegúrate que no supere el 50% para que se acomoden dos por fila
        height: 300,
        alignItems: 'center',
    },
    categoryImage: {
        width: '80%', // Ancho responsivo de la imagen
        height: '70%', // Altura responsiva de la imagen
        marginBottom: 10, // Espacio entre la imagen y el nombre
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
});