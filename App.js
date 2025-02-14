import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, TextInput, TouchableOpacity, Button, Image, Platform, LogBox } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useState, useEffect, useRef } from 'react';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

// Eliot Pearson, John Taweel, Yao Zheng, William Lu


// expo add expo-sqlite
// expo add expo-file-system
// expo add expo-document-picker
// expo add expo-sharing
// expo add expo-dev-client

/*
  For testing expo-document-picker on iOS we need a standalone app 
  which is why we install expo-dev-client
  
  If you don't have eas installed then install using the following command:
  npm install -g eas-cli
  eas login
  eas build:configure
  Build for local development on iOS or Android:
  eas build -p ios --profile development --local
  OR
  eas build -p android --profile development --local
  May need to install the following to build locally (which allows debugging)
  npm install -g yarn
  brew install fastlane
  After building install on your device:
  For iOS (simulator): https://docs.expo.dev/build-reference/simulators/
  For Android: https://docs.expo.dev/build-reference/apk/
  Run on installed app:
  expo start --dev-client
*/

// the Notes tab on the sidebar
function Notes() {

  const [db, setDb] = useState(SQLite.openDatabase('note.db'));
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(undefined);

  // creating table to store note data
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, note TEXT)')
    });

    db.transaction(tx => {
      tx.executeSql('SELECT * FROM notes', null,
        (txObj, resultSet) => setNotes(resultSet.rows._array),
        (txObj, error) => console.log(error)
      );
    });

    setIsLoading(false);
  }, [db]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading notes...</Text>
      </View>
    );
  }

  const addNote = () => {
    db.transaction(tx => {
      tx.executeSql('INSERT INTO notes (note) values (?)', [currentNote],
        (txObj, resultSet) => {
          let existingNotes = [...notes];
          existingNotes.push({ id: resultSet.insertId, note: currentNote});
          setNotes(existingNotes);
          setCurrentNote(undefined);
        },
        (txObj, error) => console.log(error)
      );
    });

  }

  const deleteNote = (id) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM notes WHERE id = ?', [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingNotes = [...notes].filter(note => note.id !== id);
            setNotes(existingNotes);
          }
        },
        (txObj, error) => console.log(error)
      );
    });
  };

  const updateNote = (id) => {
    db.transaction(tx => {
      tx.executeSql('UPDATE notes SET note = ? WHERE id = ?', [currentNote, id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingNotes = [...notes];
            const indexToUpdate = existingNotes.findIndex(note => note.id === id);
            existingNotes[indexToUpdate].note = currentNote;
            setNotes(existingNotes);
            setCurrentNote(undefined);
          }
        },
        (txObj, error) => console.log(error)
      );
    });
  };




  const showNotes = (note, index) => {
    return (
        <ScrollView style={styles.scrollStyle}>
        { [...notes].reverse().map((note, index) => {
            return (
                <View key={index} style={styles.row}>
                    <Text style={styles.textDisplay}>{note.note}</Text>

                    <TouchableOpacity onPress={() => deleteNote(note.id)} style={styles.deleteButton}>
                        <Ionicons name="close-circle-outline" size={30}color='#FFFFFF'></Ionicons>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => updateNote(note.id)} style={styles.updateButton}>
                        <Ionicons name="brush-outline" size={30}color='#FFFFFF'></Ionicons>
                    </TouchableOpacity>
                </View>
            )
        })}
        </ScrollView>)

};


  return (
    
    <View style={styles.container}>
      {/* <Text style={styles.titleFont}>Banana Book</Text> */}
      
      <TextInput value={currentNote} 
      placeholder='start typing here...' 
      onChangeText={setCurrentNote} 
      style={styles.textBox} 
      multiline={true}
      maxLength={4000}
      />

        <TouchableOpacity onPress={addNote} style={styles.addButton}>
          <Ionicons name="add-outline" size={30}color='#FFFFFF'></Ionicons>
        </TouchableOpacity>

        {showNotes()}
        <StatusBar style="auto" />
        
      
    </View>
  );
}

function Camera() {
    

  const [db, setDb] = useState(SQLite.openDatabase('image.db'));
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState([]);

  const pickImage = async () => {
    const cameraPermission = await ImagePicker.getMediaLibraryPermissionsAsync();

    console.log(cameraPermission);

    if(cameraPermission.status !== 'granted') {
      const test = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    const secondcameraPermission = await ImagePicker.getMediaLibraryPermissionsAsync();

    if(cameraPermission.status === 'granted') {
    
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [342, 140],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      db.transaction(tx => {
        tx.executeSql('INSERT INTO images (image) values (?)', [result.assets[0].uri],
          (txObj, resultSet) => {
            let existingImages = [...images];
            existingImages.push({ id: resultSet.insertId, image: result.assets[0].uri});
            setImages(existingImages);
          },
          (txObj, error) => console.warn(error)
        );
      });
    }}
  };

  const takeImage = async () => {
    const cameraPermission = await ImagePicker.getCameraPermissionsAsync();

    console.log(cameraPermission);

    if(cameraPermission.status !== 'granted') {
      const test = await ImagePicker.requestCameraPermissionsAsync();
    }

    const secondcameraPermission = await ImagePicker.getCameraPermissionsAsync();

    if(cameraPermission.status === 'granted') {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      db.transaction(tx => {
        tx.executeSql('INSERT INTO images (image) values (?)', [result.assets[0].uri],
          (txObj, resultSet) => {
            let existingImages = [...images];
            existingImages.push({ id: resultSet.insertId, image: result.assets[0].uri});
            setImages(existingImages);
          },
          (txObj, error) => console.warn(error)
        );
      });
    }}
  };
  


  // creating table to store image data
  useEffect(() => {
    LogBox.ignoreAllLogs()

    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, image TEXT)')
    });

    db.transaction(tx => {
      tx.executeSql('SELECT * FROM images', null,
        (txObj, resultSet) => setImages(resultSet.rows._array),
        (txObj, error) => console.warn(error)
      );
    });

    setIsLoading(false);
  }, [db]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading Images...</Text>
      </View>
    );
  }


  const deleteImage = (id) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM images WHERE id = ?', [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingImages = [...images].filter(image => image.id !== id);
            setImages(existingImages);
          }
        },
        (txObj, error) => console.log(error)
      );
    });
  };

  const showImages = (image, index) => {
    return (
        <ScrollView style={styles.scrollStyle}>
        { [...images].reverse().map((image, index) => {
            return (
                <View key={index} style={styles.row}>
                    {image && <Image source={{ uri: image.image }} style={{ minWidth: 342, resizeMode: 'contain', minHeight: 342, backgroundColor: "#F1F1F1", borderRadius:15}} />}
                    
                    <TouchableOpacity onPress={() => deleteImage(image.id)} style={styles.deleteIMGButton}>
                        <Ionicons name="close-circle-outline" size={30}color='#FFFFFF'></Ionicons>
                    </TouchableOpacity>

                </View>
            )
        })}
        </ScrollView>)
};


  return (
    
    <View style={styles.container}>
      {/* <Text style={styles.titleFont}>Banana Book</Text> */}
      
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', left:'-9%', marginBottom: '40%', marginTop: '5%'}}>
      <TouchableOpacity onPress={() => pickImage()} style={styles.newImageButton}>
        <Ionicons name="file-tray-full-outline" size={90}color='#FFFFFF'></Ionicons>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => takeImage()} style={styles.takePictureButton}>
          <Ionicons name="camera-outline" size={90}color='#FFFFFF'></Ionicons>
      </TouchableOpacity>
      </View>


        {showImages()}
        <StatusBar style="auto" />
        
      
    </View>
  );
}

// the Folder tab on the sidebar
function Folders() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="folder-open-outline" size={160}color='#2F1103'></Ionicons>
      <Text>Oops! You don't have any folders...</Text>
    </View>
  );
}

// the Utilities tab on the sidebar
function Utilities() {
  return (
    <View style={{ flex: 1, backgroundColor:'#FFDD60' , justifyContent: 'center', alignItems: 'center' }}>
      <Text style={styles.utilFont}>Current Storage</Text>
      
        <TouchableOpacity onPress={exportDb} style={styles.exportButton}>
          <Text style={styles.buttonText}>Export Notes</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={importDb} style={styles.importButton}>
          <Text style={styles.buttonText}>Import Notes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraButtonMetrics}>
          <Ionicons name="bar-chart-outline" size={25}color='white'></Ionicons>
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraButtonCache}>
          <Ionicons name="save-outline" size={25}color='white'></Ionicons>
        </TouchableOpacity>
    </View>
  );
}

function AboutUs() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>About Us</Text>
    </View>
  )
}

function Help() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Help</Text>
    </View>
  )
}

const Drawer = createDrawerNavigator();   // the drawer component sidebar

// the sidebar
function MyDrawer() {
  return (
    <Drawer.Navigator useLegacyImplementation screenOptions={{
      drawerStyle: {
        backgroundColor: '#FFC848',
        width: 230,
      },
      headerStyle: {
        backgroundColor: '#FFC848',
      },
      headerTintColor: '#FFFFFF',
      drawerActiveTintColor: '#FFF0D9',
    }}>
      <Drawer.Screen name="Notes" component={Notes} />
      <Drawer.Screen name="Folders" component={Folders} />
      <Drawer.Screen name="Utilities" component={Utilities} />
      <Drawer.Screen name="Camera" component={Camera}/>
      <Drawer.Screen name="About Us" component={AboutUs}/>
      <Drawer.Screen name="Need Help?" component={Help}/>
    </Drawer.Navigator>
  );
}

const importDb = async () => {
  let result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true
  });

  if (result.type === 'success') {
    setIsLoading(true);
    
    if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
    }

    const base64 = await FileSystem.readAsStringAsync(
      result.uri,
      {
        encoding: FileSystem.EncodingType.Base64
      }
    );

    await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'SQLite/note.db', base64, { encoding: FileSystem.EncodingType.Base64 });
    await db.closeAsync();
    setDb(SQLite.openDatabase('note.db'));
  }
};

const exportDb = async () => {
  if (Platform.OS === "android") {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (permissions.granted) {
      const base64 = await FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + 'SQLite/note.db',
        {
          encoding: FileSystem.EncodingType.Base64
        }
      );

      await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, 'note.db', 'application/octet-stream')
      .then(async (uri) => {
        await FileSystem.writeAsStringAsync(uri, base64, { encoding : FileSystem.EncodingType.Base64 });
      })
      .catch((e) => console.log(e));
    } else {
      console.log("Permission not granted");
    }
  } else {
    await Sharing.shareAsync(FileSystem.documentDirectory + 'SQLite/note.db');
  }
}

// handles querying to database
export default function App() {
  
  return (
    <NavigationContainer>
      <MyDrawer />
    </NavigationContainer>

  );
}

const styles = StyleSheet.create({
  addButton: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFC848',
    borderRadius: 15,
    shadowColor: '#000000',
    elevation: 10,
    marginBottom: 20,
    position: 'absolute',
    top: '26.5%',
    right: '1%'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#FFEBB3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#FFDD60BF',
    borderRadius: 15,
    shadowColor: '#000000',
    elevation: 10,
    marginBottom: 40,
    position: 'absolute',
    left: 250,
    top: 5,
    //marginLeft: 150,
  },
  exportButton: {
    padding: 20,
    backgroundColor: '#FFC848',
    borderRadius: 18,
    marginBottom: 40,
    shadowColor: '#2F1103',
    elevation: 7,
  },
  importButton: {
    padding: 20,
    backgroundColor: '#FFC848',
    borderRadius: 18,
    marginBottom: 40,
    shadowColor: '#2F1103',
    elevation: 7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    margin: 8
  },
  titleFont: {
    color: '#2F1103',
    fontSize: 40,
    paddingRight: 50,
    paddingLeft: 50,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: '#FFDD60',
    alignSelf: 'center',
    borderRadius: 15,
    position: 'relative',
    bottom: 140,
    shadowColor: '#2F1103',
    elevation: 10,
  },
  textBox: {
    backgroundColor: '#F1F1F1',
    paddingLeft: '4%',
    paddingRight: '4%',
    paddingTop: '4%',
    borderRadius: 10,
    marginTop: '14%',
    position: 'relative',
    bottom: 10,
    marginBottom: '15%',
    width: '90%',
    height: '24%'
  },
  textDisplay: {
    //paddingLeft: 20,
    //paddingRight: 150,
    minHeight: 120,
    width: 342,
    paddingTop: 20,
    paddingLeft: 15,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 7,
    borderRadius: 15,
  },
  scrollStyle: {
    width: 350,
  },
  updateButton: {
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#FFC848BF',
    borderRadius: 15,
    shadowColor: '#000000',
    elevation: 10,
    marginBottom: 40,
    position: 'absolute',
    top: 5,
    left: 295,
  },
  utilFont: {
    color: '#000000',
    fontSize: 20,
    paddingLeft: 100,
    paddingRight: 100,
    paddingBottom: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 50,
    position: 'absolute',
    bottom: 550, // > 550 moves upward
    shadowColor: '#999999',
    elevation: 10,
  },
  extraButtonMetrics: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#914F16',
    borderRadius: 15,
    shadowColor: '#000000',
    elevation: 10,
    marginBottom: 40,
    position: 'absolute',
    bottom: 150,
    left: 123,
  },
  extraButtonCache: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#914F16',
    borderRadius: 15,
    shadowColor: '#000000',
    elevation: 10,
    marginBottom: 40,
    position: 'absolute',
    bottom: 150,
    left: 225,
  },
  newImageButton: {
    padding: 30,
    backgroundColor: '#FFC848',
    borderRadius: 15,
    shadowColor: '#000000',
    // elevation: 10,
    // marginBottom: 40,
    position: 'absolute',
    top: '10%',
    left: '-20%',
  },
  takePictureButton: {
    padding: 30,
    backgroundColor: '#FFC848',
    borderRadius: 15,
    shadowColor: '#000000',
    // elevation: 10,
    // marginBottom: 40,
    position: 'absolute',
    top: '10%',
    left: '20%',
  },
  deleteIMGButton: {
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#FFC84866',
    borderRadius: 15,
    shadowColor: '#000000',
    elevation: 10,
    marginBottom: 40,
    position: 'absolute',
    top: 5,
    left: 295,
  }
});