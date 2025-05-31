import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { API_BASE_URL } from '@/constants/config';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

interface CartItem {
  id: number;
  product_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchCartSummary = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get("http://localhost:8000/api/cart/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setCartItems(data.items);
      setSubtotal(data.subtotal);
      setDiscount(data.discount);
      setTotal(data.total);
      setCoupon(data.coupon_applied ?? null);
    } catch (error) {
      console.error('Error al obtener el resumen del carrito:', error);
    }
  };

  const removeItem = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.delete(`http://localhost:8000/api/cart/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      fetchCartSummary(); // Recargar después de eliminar
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      Alert.alert('Error', 'No se pudo eliminar el producto.');
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.post(
        'http://localhost:8000/api/pay-orders-stripe',
        {
          success_url: 'https://example.com/success', // usa el esquema de tu app
          cancel_url: 'https://example.com/cancel',
          coupon_code: coupon ?? '',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const url = response.data.url;
      await Linking.openURL(url); // abre en navegador externo
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      Alert.alert('Error', 'No se pudo iniciar el proceso de pago.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCartSummary();
    }, [])
  );


  // Manejar retorno desde Stripe con deep linking
  useEffect(() => {
    const handleDeepLink = (event: Linking.EventType) => {
      const url = event.url;

      if (url.includes('success')) {
        fetchCartSummary();
        Alert.alert('Pago exitoso', 'Tu pedido ha sido procesado.');
      } else if (url.includes('cancel')) {
        Alert.alert('Pago cancelado', 'No se completó el pago.');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header con botón de retroceso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Carrito de Compras</Text>
      </View>

      {/* Contenido del carrito */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {cartItems.length === 0 ? (
          <Text style={styles.emptyCartText}>El carrito está vacío.</Text>
        ) : (
          cartItems.map((item) => (
            <View key={item.id} style={styles.itemContainer}>
              <View style={styles.itemDetails}>
                <Text style={styles.productName}>{item.product_name}</Text>
                <Text>Cantidad: {item.qty}</Text>
                <Text>Precio unitario: ${item.unit_price.toFixed(2)}</Text>
                <Text>Total: ${item.line_total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summary}>
          <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
          {discount > 0 && (
            <Text>
              Descuento: -${discount.toFixed(2)} (Cupón: {coupon})
            </Text>
          )}
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Proceder al Pago</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    // paddingTop: 70,
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

  backButton: {
    padding: 10,
    position: 'absolute',
    top: 19,
    left: 10,
    zIndex: 1000,
  },

  scrollContainer: {
    paddingBottom: 40,
    paddingTop: 60,
  },

  title: {
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    marginBottom: 10,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
  },
  total: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkoutButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    marginTop: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyCartText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#666',
  },
  footer: {
    backgroundColor: '#fff',
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderColor: '#ddd',
  },
});