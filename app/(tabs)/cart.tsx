import React, { useEffect, useState } from 'react';
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
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import { API_BASE_URL } from '@/constants/config';

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

  const [showWebview, setShowWebview] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');

  const fetchCartSummary = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/cart/summary`, {
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

      await axios.delete(`${API_BASE_URL}/cart/${id}`, {
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
        `${API_BASE_URL}/pay-orders-stripe`,
        {
          success_url: 'https://sweet-shoes-add.loca.lt/stripe/success',
          cancel_url: 'https://sweet-shoes-add.loca.lt/stripe/cancel',
          coupon_code: coupon ?? '', // si tienes código
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const url = response.data.url;
      setSessionUrl(url);
      setShowWebview(true);
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      Alert.alert('Error', 'No se pudo iniciar el proceso de pago.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartSummary();
  }, []);

  // 🔁 Manejar deep links cuando regresa desde Stripe
  useEffect(() => {
    const handleDeepLink = (event: Linking.EventType) => {
      const url = event.url;

      if (url.includes('success')) {
        setShowWebview(false);
        fetchCartSummary();
        Alert.alert('Pago exitoso', 'Tu pedido ha sido procesado.');
      } else if (url.includes('cancel')) {
        setShowWebview(false);
        Alert.alert('Pago cancelado', 'No se completó el pago.');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // Justo después de tu WebView actual
  if (showWebview && sessionUrl) {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ padding: 10, backgroundColor: '#eee' }}
          onPress={() => {
            setShowWebview(false);
            fetchCartSummary(); // refrescar el carrito
          }}
        >
          <Text style={{ textAlign: 'center', color: 'blue' }}>← Volver</Text>
        </TouchableOpacity>

        <WebView source={{ uri: sessionUrl }} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Carrito de Compras</Text>

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


        <View style={styles.summary}>
          <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
          {discount > 0 && (
            <Text>
              Descuento: -${discount.toFixed(2)} (Cupón: {coupon})
            </Text>
          )}
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Proceder al Pago</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
});