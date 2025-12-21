import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../screens/admin/styles/AdminStyles';

const Snackbar = ({ visible = false, message = '', duration = 3000, onHide = () => {}, actionLabel, onAction }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      const t = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => onHide && onHide());
      }, duration);
      return () => clearTimeout(t);
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    }
  }, [visible, anim, duration, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.container, { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }], opacity: anim }]}
    >
      <View style={styles.inner}>
        <Text style={styles.text} numberOfLines={2}>{message}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity onPress={() => { onAction && onAction(); Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => onHide && onHide()); }} accessibilityRole="button" accessibilityLabel={actionLabel} style={styles.actionButton}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => { Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => onHide && onHide()); }} accessibilityRole="button" accessibilityLabel="Cerrar notificación">
            <Text style={styles.dismiss}>X</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    zIndex: 9999,
  },
  inner: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  text: {
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  dismiss: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  }
  ,
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  }
});

export default Snackbar;
