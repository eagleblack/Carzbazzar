import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';

const SearchBar = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (text) => {
    setSearchText(text);
    onSearch && onSearch(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Left side: RTO + GJ */}
        <View style={styles.leftColumn}>
          {/* RTO */}
          <View style={styles.rtoContainer}>
            <Ionicons name="location-sharp" size={16} color={COLORS.gray} />
            <Text style={styles.rtoText}>RTO</Text>
          </View>

          {/* GJ Dropdown */}
          <TouchableOpacity style={styles.gjContainer}>
            <Text style={styles.gjText}>GJ</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={COLORS.black}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Model, year, Appt. id"
            placeholderTextColor={COLORS.black}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 12,
 
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftColumn: {
    marginRight: 12,
    justifyContent: 'center',
  },
  rtoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rtoText: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 13,
    marginLeft: 4,
  },
  gjContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gjText: {
    fontWeight: '600',
    fontSize: 13,
    color: COLORS.text,
    marginRight: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 42,
    flex: 1,
    borderWidth:1,
    borderColor:'black'
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
});

export default SearchBar;
