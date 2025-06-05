import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { JSX, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = screenWidth < 768;

interface CartItem {
  id: number;
  product_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

interface CartSummaryResponse {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  coupon_applied: string | null;
}

interface CheckoutResponse {
  url: string;
}

interface CouponResponse {
  message: string;
  discount: number;
  coupon: {
    id: number;
    name: string;
  };
}

export default function CartScreen(): JSX.Element {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Estados para cupones
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponMessage, setCouponMessage] = useState<string>('');
  const [couponMessageType, setCouponMessageType] = useState<'success' | 'error' | null>(null);

  const router = useRouter();

  const fetchCartSummary = async (couponCode?: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const url = couponCode 
        ? `http://localhost:8000/api/cart/summary?coupon=${encodeURIComponent(couponCode)}`
        : "http://localhost:8000/api/cart/summary";

      const response = await axios.get<CartSummaryResponse>(url, {
        headers: { Authorization: `Bearer ${token}` },
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

  const applyCoupon = async (): Promise<void> => {
    if (!couponInput.trim()) {
      setCouponMessage('Por favor ingresa un código de cupón');
      setCouponMessageType('error');
      return;
    }

    try {
      setCouponLoading(true);
      setCouponMessage('');
      setCouponMessageType(null);

      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.post<CouponResponse>(
        'http://localhost:8000/api/cart/apply-coupon',
        { coupon: couponInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCouponMessage(response.data.message);
      setCouponMessageType('success');
      
      // Actualizar el resumen del carrito con el cupón aplicado
      await fetchCartSummary(couponInput.trim());
      
      // Limpiar el input
      setCouponInput('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al aplicar el cupón';
      setCouponMessage(errorMessage);
      setCouponMessageType('error');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = async (): Promise<void> => {
    setCoupon(null);
    setCouponMessage('');
    setCouponMessageType(null);
    await fetchCartSummary();
  };

  const removeItem = async (id: number): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.delete(`http://localhost:8000/api/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refrescar con el cupón actual si existe
      await fetchCartSummary(coupon || undefined);
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      Alert.alert('Error', 'No se pudo eliminar el producto.');
    }
  };

  const updateQuantity = async (id: number, qty: number): Promise<void> => {
    try {
      if (qty < 1) return;

      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.put(
        `http://localhost:8000/api/cart/${id}`,
        { qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refrescar con el cupón actual si existe
      await fetchCartSummary(coupon || undefined);
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    }
  };

  const handleCheckout = async (): Promise<void> => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.post<CheckoutResponse>(
        'http://localhost:8000/api/pay-orders-stripe',
        {
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
          coupon_code: coupon ?? '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await Linking.openURL(response.data.url);
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

  useEffect(() => {
    const handleDeepLink = (event: Linking.EventType): void => {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>🛒 Carrito de Compras</Text>
      </View>

      <View style={styles.content}>
        {/* Main Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={!isWeb}
          bounces={!isWeb}
          scrollEventThrottle={16}
        >
          {cartItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={80} color="#d1d5db" />
              <Text style={styles.emptyCartText}>Tu carrito está vacío</Text>
              <Text style={styles.emptyCartSubText}>
                Agrega algunos productos para comenzar
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.itemsList}>
                {cartItems.map((item) => (
                  <View key={item.id} style={styles.itemContainer}>
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.productName}>{item.product_name}</Text>
                        <TouchableOpacity 
                          onPress={() => removeItem(item.id)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.itemDetails}>
                        <Text style={styles.priceText}>
                          ${item.unit_price.toFixed(2)} c/u
                        </Text>
                        
                        <View style={styles.quantityContainer}>
                          <TouchableOpacity 
                            onPress={() => updateQuantity(item.id, item.qty - 1)}
                            style={styles.quantityButton}
                          >
                            <Ionicons name="remove" size={18} color="#6b7280" />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.qty}</Text>
                          <TouchableOpacity 
                            onPress={() => updateQuantity(item.id, item.qty + 1)}
                            style={styles.quantityButton}
                          >
                            <Ionicons name="add" size={18} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.totalText}>
                          ${item.line_total.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Cupón Section */}
              <View style={styles.couponSection}>
                <Text style={styles.couponTitle}>
                  <Ionicons name="pricetag-outline" size={20} color="#2563eb" /> Código de Descuento
                </Text>
                
                {coupon ? (
                  <View style={styles.appliedCouponContainer}>
                    <View style={styles.appliedCouponContent}>
                      <View style={styles.appliedCouponInfo}>
                        <Ionicons name="checkmark-circle" size={20} color="#059669" />
                        <Text style={styles.appliedCouponText}>
                          Cupón aplicado: <Text style={styles.couponCode}>{coupon}</Text>
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={removeCoupon}
                        style={styles.removeCouponButton}
                      >
                        <Ionicons name="close" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.couponInputContainer}>
                    <View style={styles.couponInputWrapper}>
                      <TextInput
                        style={styles.couponInput}
                        placeholder="Ingresa tu código de cupón"
                        value={couponInput}
                        onChangeText={setCouponInput}
                        autoCapitalize="characters"
                        placeholderTextColor="#9ca3af"
                      />
                      <TouchableOpacity
                        style={[styles.applyCouponButton, couponLoading && styles.applyCouponButtonDisabled]}
                        onPress={applyCoupon}
                        disabled={couponLoading}
                      >
                        {couponLoading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.applyCouponButtonText}>Aplicar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    {couponMessage && (
                      <View style={[
                        styles.couponMessage,
                        couponMessageType === 'success' ? styles.couponMessageSuccess : styles.couponMessageError
                      ]}>
                        <Ionicons 
                          name={couponMessageType === 'success' ? "checkmark-circle" : "alert-circle"} 
                          size={16} 
                          color={couponMessageType === 'success' ? "#059669" : "#ef4444"} 
                        />
                        <Text style={[
                          styles.couponMessageText,
                          couponMessageType === 'success' ? styles.couponMessageTextSuccess : styles.couponMessageTextError
                        ]}>
                          {couponMessage}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Summary Footer */}
        {cartItems.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              
              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.discountLabel]}>
                    Descuento {coupon ? `(${coupon})` : ''}:
                  </Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    -${discount.toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.checkoutButtonText}>Procesando...</Text>
                </View>
              ) : (
                <View style={styles.checkoutContent}>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.checkoutButtonText}>Proceder al Pago</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: isWeb ? 20 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  title: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    maxWidth: isWeb ? 800 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyCartSubText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  itemsList: {
    gap: 16,
    marginBottom: 24,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      },
    }),
  },
  itemContent: {
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  itemDetails: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? 12 : 16,
  },
  priceText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  // Estilos para la sección de cupones
  couponSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      },
    }),
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedCouponContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  appliedCouponContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedCouponText: {
    fontSize: 16,
    color: '#059669',
    marginLeft: 8,
  },
  couponCode: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  removeCouponButton: {
    padding: 4,
  },
  couponInputContainer: {
    gap: 12,
  },
  couponInputWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  applyCouponButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyCouponButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  applyCouponButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  couponMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  couponMessageSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  couponMessageError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  couponMessageText: {
    fontSize: 14,
    flex: 1,
  },
  couponMessageTextSuccess: {
    color: '#059669',
  },
  couponMessageTextError: {
    color: '#ef4444',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.07)',
      },
    }),
  },
  summary: {
    marginBottom: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  discountLabel: {
    color: '#059669',
  },
  discountValue: {
    color: '#059669',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  checkoutButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  checkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});