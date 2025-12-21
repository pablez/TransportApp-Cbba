import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { FONT_MULTIPLIER } from '../../screens/admin/styles/AdminStyles';
import { Ionicons } from '@expo/vector-icons';

const OverflowMenu = ({ options = [], iconSize = 20, accessibilityLabel = 'Más acciones' }) => {
  const [visible, setVisible] = useState(false);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  const handlePress = (cb) => {
    if (typeof cb === 'function') cb();
    close();
  };

  return (
    <>
      <TouchableOpacity onPress={open} accessibilityLabel={accessibilityLabel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="ellipsis-vertical" size={iconSize} color="#444" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.menuContainer} pointerEvents="box-none">
          <View style={styles.menu}>
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.menuItem}
                onPress={() => handlePress(opt.onPress)}
                accessibilityRole="button"
              >
                {opt.icon && <View style={styles.iconWrap}>{opt.icon}</View>}
                <Text style={styles.menuText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 220,
    elevation: 4,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  iconWrap: {
    marginRight: 10,
  },
  menuText: {
    fontSize: Math.round(15 * FONT_MULTIPLIER),
    color: '#222'
  }
});

export default OverflowMenu;
