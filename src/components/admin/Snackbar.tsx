import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  message: string;
}

const Snackbar: React.FC<Props> = ({ visible, message }) => {
  const translateY = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateY, { toValue: 80, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, translateY]);

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.inner}>
        <Text style={styles.text}>{message}</Text>
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
    zIndex: 200,
  },
  inner: {
    backgroundColor: '#323232',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default Snackbar;
