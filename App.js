import React, { useState, useEffect,useRef,useLayoutEffect,useCallback} from 'react';
import { NavigationContainer,useFocusEffect,useNavigation,useNavigationState} from '@react-navigation/native';
import { createStackNavigator,CardStyleInterpolators} from '@react-navigation/stack';
import { View, Text, FlatList, TouchableOpacity, TextInput,Image, ScrollView, Modal, TouchableWithoutFeedback,Animated,Dimensions,Linking,Pressable,Alert} from 'react-native'; // Image 컴포넌트 추가
import Swipeout from 'react-native-swipeout'; // react-native-swipeout 라이브러리 추가
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage 추가
import { Audio } from 'expo-av'; // Expo Audio API 불러오기
import { StatusBar } from 'expo-status-bar';
import { IMAGE_DATA } from './ImageData';
import { styles } from './Styles';
import { imageSources } from './ImageSources';
import { soundSources } from './SoundSources';
import Slider from '@react-native-community/slider';
import * as Font from 'expo-font';
import  {  ReactNativeZoomableView  }  from  '@openspacelabs/react-native-zoomable-view' ;

async function loadFonts() {
  await Font.loadAsync({
    'HakgyoansimBareonbatangB': require('./assets/fonts/HakgyoansimBareonbatangB.ttf'),
    'NotoSansKR-Regular': require('./assets/fonts/NotoSansKR-Regular.ttf'),
    'NotoSansKR-Bold': require('./assets/fonts/NotoSansKR-Bold.ttf'),

  });
}



const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const HelpModal = ({ visible, onClose }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay2}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContent2}>
            <Text style={styles.modalText1}>
              <Text style={[styles.modalText1, styles.heading]}>
                언덕위의 찬송 앱을  {'\n'}이용해 주셔서 감사합니다.
                {'\n\n'}
              </Text>
              언덕 위의 찬송 앱은 수록곡 257곡의 악보와 일부 음원, 그리고 간단한 기능을 제공합니다.
              {'\n\n'}
              ⦁ 찬송 검색 (장, 제목, 가사로 검색할 수 있습니다.) {'\n\n'} 
              ⦁ 메뉴-더욱 소중히 불러보고 싶은 찬송(즐겨찾기) {'\n\n'} 
              각 항목을 왼쪽으로 스와이프하여 지정/해제,{'\n'}
              왼쪽 상단 메뉴-더욱 소중히 불러보고 싶은 찬송에서 확인할 수 있습니다. {'\n\n'} 
              ⦁ 찬송 재생 (처음부터 재생, 재생/정지, 반복 재생) {'\n\n'} 
              ⦁ 메뉴-진토리 홈페이지 접속  {'\n\n'} 
              <Text style={styles.smallText}>
                {'<'}추가 문의 및 요청{'>'}{'\n'}sshkimssh@naver.com{'\n'}juani00@naver.com
              </Text>
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>닫기</Text>
      </TouchableOpacity>         
       </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);


const OpeningScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(
        fadeAnim,
        {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }
      ).start(() => navigation.replace('Home'));
    }, 2000);
    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <View style={{ flex: 1 }}>
    <Animated.View style={{ ...styles.containerop, opacity: fadeAnim }}>
      <Image source={require('./OpeningImage.png')} style={[styles.imageOpen, { resizeMode: 'cover' }]} />
    </Animated.View>
    </View>
  );
};



const HomeScreen = (route) => {

  const navigation = useNavigation(); 
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNames, setFilteredNames] = useState(IMAGE_DATA);
  const [modalVisible, setModalVisible] = useState(false);
  const [swipeoutClose, setSwipeoutClose] = useState(true);
  const [swipeLocked, setSwipeLocked] = useState(false);
  
  const [modalVisible2, setModalVisible2] = useState(false);
  
  const flatListRef = useRef(); // FlatList 참조를 저장하기 위한 ref
  const { scrollToIndex } = route.params || {};

  useEffect(() => {
    if (scrollToIndex !== undefined && flatListRef.current) {
      flatListRef.current.scrollToIndex({ animated: true, index: scrollToIndex });
    }
  }, [scrollToIndex]);

  // 앱이 로드될 때 글꼴 로드하기
useEffect(() => {
  loadFonts();
}, []);

  const openModal2 = () => {
    setModalVisible2(true);
  };

  const closeModal2 = () => {
    setModalVisible2(false);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => null, // 메인 페이지에서 headerLeft 비활성화
      // 다른 네비게이션 옵션들...
    });
  }, [navigation]);

    // 즐겨찾기와 검색 결과를 업데이트하는 로직
    useEffect(() => {
      async function updateList() {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        const favorites = storedFavorites ? JSON.parse(storedFavorites) : {};
  
        const updatedNamesWithFavorites = IMAGE_DATA.map(item => ({
          ...item,
          favorite: !!favorites[item.id],
        }));
  
        if (searchQuery) {
          const searchQueryLower = searchQuery.toLowerCase().replace(/\s+/g, ''); // 띄워쓰기 제거 및 소문자 변환
          const filtered = updatedNamesWithFavorites.filter(image =>
            image.name.toLowerCase().replace(/\s+/g, '').includes(searchQueryLower) ||
            (image.text && image.text.toLowerCase().replace(/\s+/g, '').includes(searchQueryLower))
          );
          setFilteredNames(filtered);
        } else {
          // 검색어가 없는 경우 업데이트된 전체 목록 사용
          setFilteredNames(updatedNamesWithFavorites);
        } 
      }
  
      updateList();
    }, [searchQuery]);
  
    // 검색어를 초기화하는 함수
    const clearSearch = () => {
      setSearchQuery('');
    };
  
    // 즐겨찾기를 토글하는 함수
    const toggleFavorite = async (id) => {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      let favorites = storedFavorites ? JSON.parse(storedFavorites) : {};
    
      // 즐겨찾기 상태 토글
      favorites[id] = !favorites[id];
      
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
    
      // filteredNames 상태 업데이트로 UI 즉시 반영
      setFilteredNames(currentFilteredNames =>
        currentFilteredNames.map(item => ({
          ...item,
          favorite: item.id === id ? !item.favorite : item.favorite,
        }))
      );
    };

    useEffect(() => {
      updateList(); // 검색어가 변경될 때마다 목록 업데이트
    }, [searchQuery]);
    
    const updateList = async () => {
      // 여기에 즐겨찾기 상태와 검색어를 기반으로 목록을 업데이트하는 로직 구현
    };

  
  useEffect(() => {
    const setAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          //interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX, // iOS에서 다른 앱에 의해 오디오가 중단되지 않도록 설정
          playsInSilentModeIOS: true, // 무음 모드에서도 소리 재생 허용
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Error setting audio mode', error);
      }
    };

    setAudioMode();
  }, []);

  useEffect(() => {
    if (swipeLocked) {
      setSwipeoutClose(false);
    }
  }, [swipeLocked]);

  const toggleSwipeout = (id) => {
    if (!swipeLocked) {
      setSwipeoutClose(true);
    }
  };

  const handleSwipeClose = () => {
    setSwipeLocked(false);
  };

  useEffect(() => {
    // 즐겨찾기 상태 초기화 및 로드
    loadFavorites();
  }, []);

  // 화면 포커스가 변경될 때마다 즐겨찾기 상태와 검색 결과 다시 로드

  useFocusEffect(
    React.useCallback(() => {
      async function updateList() {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        const favorites = storedFavorites ? JSON.parse(storedFavorites) : {};
  
        let updatedNamesWithFavorites = IMAGE_DATA.map(item => ({
          ...item,
          favorite: !!favorites[item.id],
        }));
  
        // 검색어가 있으면 검색 결과 유지
        if (searchQuery) {
          const searchQueryLower = searchQuery.toLowerCase().replace(/\s+/g, '');
          updatedNamesWithFavorites = updatedNamesWithFavorites.filter(image =>
            image.name.toLowerCase().replace(/\s+/g, '').includes(searchQueryLower) ||
            (image.text && image.text.toLowerCase().replace(/\s+/g, '').includes(searchQueryLower))
          );
        }
  
        setFilteredNames(updatedNamesWithFavorites);
      }
  
      updateList();
    }, [searchQuery]) // 검색어 상태를 의존성 배열에 추가
  );
  const loadFavorites = async () => {
    try {
      const favoriteStates = await Promise.all(
        IMAGE_DATA.map(async (item) => {
          const value = await AsyncStorage.getItem(`favorite_${item.id}`);
          return value !== null ? JSON.parse(value) : false;
        })
      );
      return favoriteStates;
    } catch (error) {
      console.error('Error loading favorite state', error);
      return [];
    }
  };
  
  const openModal = () => {
    setSearchQuery(''); // 모달을 열 때 검색어를 초기화합니다.
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const navigateToNewSongScreen = () => {
    navigation.navigate('더욱 소중히 불러보고 싶은 찬송', { favoriteSongs: filteredNames.filter(item => item.favorite) });
    setModalVisible(false);
  };

  const navigateToJintoriWebsite = async () => {
    const url = 'http://www.jintory.or.kr';

    try {
      // Attempt to open the URL
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Don't know how to open URI: " + url);
      }
    } catch (error) {
      console.error('An error occurred', error);
    }
  };

  const MemoizedListItem = React.memo(({ item, navigation, toggleFavorite }) => {
    // 임시 즐겨찾기 상태를 관리하기 위한 상태
    const [isFavoriteTemp, setIsFavoriteTemp] = useState(item.favorite);
  
    return (
      <Swipeout
        key={item.id}
        right={[
          {
            text: (
              <Pressable
                onPressIn={() => setIsFavoriteTemp(!isFavoriteTemp)} // 손가락을 올렸을 때 임시 상태 변경
                onPressOut={() => toggleFavorite(item.id)} // 손가락을 떼었을 때 최종 상태 변경 및 업데이트
              >
                <Image
                  source={isFavoriteTemp ? require('./images/BookMark_en.png') : require('./images/BookMark_dis.png')}
                  style={{ width: 70, height: 70 }}
                  resizeMode="contain"
                />
              </Pressable>
            ),
            backgroundColor: 'white',
          },
        ]}
        close={swipeoutClose}
        onOpen={() => toggleSwipeout(item.id)}
        onClose={handleSwipeClose}
      >
      <TouchableOpacity onPress={() => navigation.navigate('ImageDetail', { imageName: item.name })}>
          <View style={styles.itemContainer}>
            <Text style={[styles.itemName, { fontFamily: item.favorite ? 'NotoSansKR-Bold' : 'NotoSansKR-Regular', color: item.favorite ? 'black' : 'black' }]}>
              {item.name}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeout>
    );
  });
  
  

  return (
    <View style={styles.container}>
        <Text style={styles.title}>찬송 목록</Text>
        <TouchableOpacity onPress={openModal2} style={styles.helpButtonContainer}>
  <Image source={require('./images/Help.png')} style={styles.helpIcon} />
  <Text style={styles.helpButtonText}>도움말</Text>
</TouchableOpacity>

      {/* 모달 컴포넌트 추가 */}
      <HelpModal visible={modalVisible2} onClose={closeModal2} />

      <TextInput
    style={styles.searchInput}
    placeholder="장, 제목, 가사로 검색"
    value={searchQuery}
    onChangeText={setSearchQuery}
    />
<TouchableOpacity onPress={clearSearch} style={[styles.clearButton, searchQuery ? null : styles.clearButtonDisabled]}>
  <Image
    source={require('./images/SearchCancel.png')}
    style={styles.clearButtonImage}
  />
</TouchableOpacity>

  
<FlatList
      ref={flatListRef}

  contentContainerStyle={styles.scrollViewContent}
  keyboardDismissMode="on-drag" // 스크롤 중에 키보드를 자동으로 닫기
  data={filteredNames}
  extraData={filteredNames}
  renderItem={({ item }) => (
    
    <MemoizedListItem
      item={item}
      navigation={navigation}
      toggleFavorite={toggleFavorite}
    />
  )}
  keyExtractor={(item) => item.id.toString()}
  ItemSeparatorComponent={() => <View style={styles.separator} />} // 여기에 구분선 컴포넌트 추가
/>

      <View style={styles.menuButtonContainer}>
  <TouchableOpacity onPress={openModal}>
    <Text style={styles.menuButtonText}>☰</Text>
  </TouchableOpacity>
</View>
<Modal
  screenOptions={{ headerShown: false }}
  visible={modalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={closeModal}
>
  {/* 모달의 배경을 터치할 때 모달을 닫도록 설정 */}
  <TouchableWithoutFeedback onPress={closeModal}>
    <View style={styles.modalOverlay} />
  </TouchableWithoutFeedback>
  {/* 모달 내용 */}
  <View style={styles.modalContent}>
    {/* 모달 내용 추가 */}
    <TouchableOpacity onPress={navigateToNewSongScreen}>
      <Text style={styles.modalItem}> ♫    더욱 소중히 불러보고 싶은 찬송</Text>
    </TouchableOpacity>
          {/* Add a menu item for '진토리 홈페이지' */}
          <TouchableOpacity onPress={navigateToJintoriWebsite}>
            <Text style={styles.modalItem}> ✚    진토리 홈페이지</Text>
          </TouchableOpacity>
  </View>
</Modal>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
setY = height * 0.2

const ImageDetailScreen = ({ route,navigation }) => {
  const { imageName } = route.params;

  const images = imageSources[imageName];
  const soundSource = soundSources[imageName];

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); // 즐겨찾기 상태
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 새로운 state 추가

  const imageKeys = Object.keys(imageSources); // 이미지 키 배열 생성
  const currentIndex = imageKeys.indexOf(imageName); // 현재 이미지 인덱스 찾기

  

 
  // 이미지 이름으로부터 인덱스 찾기
  const imageNames = Object.keys(imageSources); // 모든 이미지 이름을 배열로 변환
  const index = imageNames.indexOf(imageName); // 현재 이미지의 인덱스

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevImageName = imageKeys[currentIndex - 1];
      // replace 대신 push 사용
      navigation.push('ImageDetailScreen', { imageName: prevImageName, direction: 'back' });
    }
  };
  
  const goToNext = () => {
    if (currentIndex < imageKeys.length - 1) {
      const nextImageName = imageKeys[currentIndex + 1];
      // replace 대신 push 사용
      navigation.push('ImageDetailScreen', { imageName: nextImageName });
    }
  };

  
 
useLayoutEffect(() => {
  navigation.setOptions({
    headerShown: true,
    headerTintColor: 'white',
    headerBackground: () => (
      <Image
        source={require('./images/coverImage.png')}
        style={{ width: '100%', height: '110%', resizeMode: 'cover' }}
      />
    ),
    headerLeft: () => (
      <View style={styles.headerLeftContainer}>
      <TouchableOpacity onPress={() => navigation.replace('Home', { direction: 'back' })}>
          <Image
            source={require('./images/previous.png')}
            style={styles.buttonImagePrevIndex}
          />
          <Text style={styles.buttonTextIndex}>목록</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToPrevious} style={{ flexDirection: 'row', alignItems: 'center',  position: 'absolute',   left: 100 ,}}>
           <Image
                source={require('./images/previous.png')}
                style={{ flexDirection: 'row', alignItems: 'center',  width: 22, height: 22}}
              />
          {/* <Text style={{fontSize: 20,color: 'white',}}>이전</Text> */}
        </TouchableOpacity>
      </View>
    ),
 
    headerRight: () => (
      <TouchableOpacity onPress={goToNext} style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute',  right: 80 }}>
        {/* <Text style={{fontSize: 20,color: 'white',}}>다음</Text> */}
        <Image
                source={require('./images/next.png')}
                style={{ flexDirection: 'row', alignItems: 'center',  width: 22, height: 22}}
              />
      </TouchableOpacity>
    ),
      
    
    title: `${imageNames[index].match(/\d+/)}장`,
    headerTitleStyle: {
      fontSize: 23, // 여기에서 폰트 사이즈를 원하는 크기로 조정하세요.
      
    },
    headerTitleAlign: 'center', // 타이틀을 가운데로 정렬
  });
}, [navigation, imageNames, index, goToPrevious, goToNext,isFavorite, route.params]);

useEffect(() => {
  loadSound();

  return () => sound?.unloadAsync();
}, [soundSource]);

async function loadSound() {
  if (sound) {
    await sound.unloadAsync();
  }
  setIsLoading(true);
  const { sound: newSound, status } = await Audio.Sound.createAsync(
    soundSource,
    {
      isLooping: isLooping,
      isPlaying: isPlaying,
      positionMillis: 0,
      shouldPlay: isPlaying,
    },
    onPlaybackStatusUpdate
  );
  setSound(newSound);
  setIsLoading(false);
  onPlaybackStatusUpdate(status);
}

const onPlaybackStatusUpdate = (status) => {
  if (!status.isLoaded) {
    setIsLoading(true);
    return;
  }
  setIsLoading(false);
  setIsPlaying(status.isPlaying);
  setPlaybackPosition(status.positionMillis);
  setPlaybackDuration(status.durationMillis || 0);
};

const handleTogglePlayPause = async () => {
  if (!sound) {
    Alert.alert("음원 미등록", "음원이 아직 준비중입니다.");
    return;
  }

  if (isPlaying) {
    await sound.pauseAsync();
  } else {
    await sound.playAsync();
  }
};

const handleRestart = async () => {
  if (sound) {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  }
};

const handleSliderValueChange = async (value) => {
  if (!sound || isLoading) return;
  const newPosition = Math.floor(value * playbackDuration);
  await sound.setPositionAsync(newPosition);
};

const toggleLooping = async () => {
  if (sound) {
    await sound.setIsLoopingAsync(!isLooping);
    setIsLooping(!isLooping);
  }
};

useFocusEffect(
  React.useCallback(() => {
    return () => {
      sound?.stopAsync();
    };
  }, [sound])
);


const [sliderValue, setSliderValue] = useState(0); // 올바른 초기값 설정




  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      //maximumZoomScale={2}
      //minimumZoomScale={1}
      showsHorizontalScrollIndicator={false}
      //showsVerticalScrollIndicator={false}
    >
    
   <View style={{ flexGrow: 1}}>

    
       
      <ReactNativeZoomableView   style={{ flexGrow: 1}}// ZoomableView 추가
      
      maxZoom={images.length > 1 ? 4 : 2} // 최대 줌 배율
      minZoom={images.length > 1 ? 2.2 : 1}
      zoomStep={4} // 줌 단계
      initialZoom={images.length > 1 ? 2.2: 1} // 초기 줌 배율
      bindToBorders={true}
      initialOffsetY={images.length > 1 ? setY: 1}
          
          
          
        >
      {images.map((image, index) => (
        <Image key={index} source={image} style={images.length > 1 ? styles.image2 : styles.image} />
      ))}
      </ReactNativeZoomableView>
      
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' ,top:0}}>
      <Text>{formatTime(playbackPosition)} / {formatTime(playbackDuration)}</Text>
  <View style={{ flexDirection: 'row' }}>
  <Slider
          style={{ width: 200, height: 40 }}
          minimumValue={0}
          maximumValue={1}
          value={sliderValue} // 상태를 바인딩
          onValueChange={value => setSliderValue(value)}
          onSlidingComplete={handleSliderValueChange} // 사용자가 드래그를 완료했을 때 호출
          minimumTrackTintColor="#50594f"
          maximumTrackTintColor="#CCCCCC"
          thumbTintColor="#88ab85"
        />
  {/* 반복 재생 토글 버튼 */}
</View>
<View style={{ flexDirection: 'row', justifyContent: 'center',left: 8, bottom:10}}>
<TouchableOpacity onPress={handleRestart} style={{ marginRight: 20 }}>
            <Image source={require('./images/backward.png')} style={{ width: 30, height: 30}} />
          </TouchableOpacity>
  {/* 재생/일시정지 토글 버튼 */}
            <TouchableOpacity onPress={handleTogglePlayPause} style={{ marginRight: 40,marginLeft:30}}>
            <Image
              source={isPlaying ? require('./images/pause.png') : require('./images/play.png')}
              style={{ width: 30, height: 30}}
            />
          </TouchableOpacity>

  {/* 반복 재생 토글 버튼 */}
  <TouchableOpacity onPress={toggleLooping} style={{ marginRight: 20 }}>
  <Image
    source={isLooping ? require('./images/looping.png') : require('./images/nonloop.png')} // 이미지 경로는 실제 프로젝트 구조에 맞게 조정
    style={{ width: 30, height: 30 }}// 이미지 크기 조정
  /> 
   </TouchableOpacity>
   
</View>

      </View>
      
     
      </View>
      </ScrollView>
  );
};


const ImageDetails_New = ({ route,navigation}) => {
  const { imageName, favoriteSongs } = route.params;

  // 이미지와 오디오 소스 상태 추가
  const [currentImage, setCurrentImage] = useState(null);
  const [soundSource, setSoundSource] = useState(null);
  
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 새로운 state 추가

  const currentIndex = favoriteSongs.findIndex(song => song.name === imageName);
  const [index, setIndex] = useState(currentIndex);

  const goToPrevious = () => {
    if (index <= 0) {
      return; // 첫 번째 아이템에서 더 이전으로 갈 수 없음, 아무런 동작도 하지 않음
    }
    const previousIndex = index - 1;
    // 페이지 교체 로직, 예를 들어
    navigation.push('ImageDetails_New', { 
      imageName: favoriteSongs[previousIndex].name, 
      favoriteSongs: favoriteSongs,
      direction: 'back'
    });
  };
  
  const goToNext = () => {
    if (index >= favoriteSongs.length - 1) {
      return; // 마지막 아이템에서 더 다음으로 갈 수 없음, 아무런 동작도 하지 않음
    }
    const nextIndex = index + 1;
    // 페이지 교체 로직, 예를 들어
    navigation.push('ImageDetails_New', { 
      imageName: favoriteSongs[nextIndex].name, 
      favoriteSongs: favoriteSongs 
    });
  };
  

  // 현재 이미지의 상세 정보를 보여줍니다.
  const currentSong = favoriteSongs[index];

  
  
    // 초기 마운트 시에만 헤더 배경 설정
    useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: true,
        headerTintColor: 'white',
        headerBackground: () => (
          <Image
            source={require('./images/coverImage.png')}
            style={{ width: '100%', height: '110%', resizeMode: 'cover' }}
          />
          
        ),
      });
    }, []); // 의존성 배열을 비워 초기 마운트 시에만 실행
    
    useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: true,
        headerTintColor: 'white',
        headerBackground: () => (
          <Image
            source={require('./images/coverImage.png')}
            style={{ width: '100%', height: '110%', resizeMode: 'cover' }}
          />
        ),
        headerLeft: () => (
          <View style={styles.headerLeftContainer}>
          <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Image
             source={require('./images/previous.png')}
            style={styles.buttonImagePrevIndex}
         />
          <Text style={styles.buttonTextIndex}>목록</Text>
          </TouchableOpacity>

            <TouchableOpacity onPress={goToPrevious} style={{ flexDirection: 'row', alignItems: 'center',  position: 'absolute',   left: 100 ,}}>
               <Image
                    source={require('./images/previous.png')}
                    style={{ flexDirection: 'row', alignItems: 'center',  width: 22, height: 22}}
                  />
              {/* <Text style={{fontSize: 20,color: 'white',}}>이전</Text> */}
            </TouchableOpacity>
          </View>
        ),
     
        headerRight: () => (
          <TouchableOpacity onPress={goToNext} style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute',  right: 80 }}>
            {/* <Text style={{fontSize: 20,color: 'white',}}>다음</Text> */}
            <Image
                    source={require('./images/next.png')}
                    style={{ flexDirection: 'row', alignItems: 'center',  width: 22, height: 22}}
                  />
          </TouchableOpacity>
        ),
          
        title: `${currentSong.name.match(/\d+/)}장`,
        headerTitleStyle: {
          fontSize: 23,
        },
        headerTitleAlign: 'center', // 타이틀을 가운데로 정렬
      });
    }, [navigation, currentSong, index, goToPrevious, goToNext]);

    // 인덱스가 변경될 때마다 이미지와 오디오 소스를 업데이트
    useEffect(() => {
      setCurrentImage(imageSources[favoriteSongs[index].name][0]);
      setSoundSource(soundSources[favoriteSongs[index].name]);
    }, [index, favoriteSongs]);
    
    

    useEffect(() => {
      loadSound();
    
      return () => sound?.unloadAsync();
    }, [soundSource]);
    
    async function loadSound() {
      if (sound) {
        await sound.unloadAsync();
      }
      setIsLoading(true);
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        soundSource,
        {
          isLooping: isLooping,
          isPlaying: isPlaying,
          positionMillis: 0,
          shouldPlay: isPlaying,
        },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsLoading(false);
      onPlaybackStatusUpdate(status);
    }
    
    const onPlaybackStatusUpdate = (status) => {
      if (!status.isLoaded) {
        setIsLoading(true);
        return;
      }
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
    };
    
    const handleTogglePlayPause = async () => {
      if (!sound) {
        Alert.alert("음원 미등록", "음원이 아직 준비중입니다.");
        return;
      }
    
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    };
    
    const handleRestart = async () => {
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    };
    
    const handleSliderValueChange = async (value) => {
      if (!sound || isLoading) return;
      const newPosition = Math.floor(value * playbackDuration);
      await sound.setPositionAsync(newPosition);
    };
    
    const toggleLooping = async () => {
      if (sound) {
        await sound.setIsLoopingAsync(!isLooping);
        setIsLooping(!isLooping);
      }
    };
    
    useFocusEffect(
      React.useCallback(() => {
        return () => {
          sound?.stopAsync();
        };
      }, [sound])
    );

    const images = imageSources[imageName];

    const [sliderValue, setSliderValue] = useState(0); // 올바른 초기값 설정

    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        //maximumZoomScale={2}
        //minimumZoomScale={1}
        showsHorizontalScrollIndicator={false}
        //showsVerticalScrollIndicator={false}
      >
      <View style={{ flex: 1}}>
  
      
         
        <ReactNativeZoomableView // ZoomableView 추가
        
        maxZoom={images.length > 1 ? 4 : 2} // 최대 줌 배율
        minZoom={images.length > 1 ? 2.2 : 1}
        zoomStep={4} // 줌 단계
        initialZoom={images.length > 1 ? 2.2: 1} // 초기 줌 배율
        bindToBorders={true}
        initialOffsetY={images.length > 1 ? setY: 1}
          >
        {images.map((image, index) => (
          <Image key={index} source={image} style={images.length > 1 ? styles.image2 : styles.image} />
        ))}
        </ReactNativeZoomableView>
        
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' ,top:0}}>
        <Text>{formatTime(playbackPosition)} / {formatTime(playbackDuration)}</Text>
    <View style={{ flexDirection: 'row' }}>
    <Slider
            style={{ width: 200, height: 40 }}
            minimumValue={0}
            maximumValue={1}
            value={sliderValue} // 상태를 바인딩
            onValueChange={value => setSliderValue(value)}
            onSlidingComplete={handleSliderValueChange} // 사용자가 드래그를 완료했을 때 호출
            minimumTrackTintColor="#50594f"
            maximumTrackTintColor="#CCCCCC"
            thumbTintColor="#88ab85"
          />
    {/* 반복 재생 토글 버튼 */}
  </View>
  <View style={{ flexDirection: 'row', justifyContent: 'center',left: 8, bottom:5}}>
  <TouchableOpacity onPress={handleRestart} style={{ marginRight: 20 }}>
              <Image source={require('./images/backward.png')} style={{ width: 30, height: 30}} />
            </TouchableOpacity>
    {/* 재생/일시정지 토글 버튼 */}
              <TouchableOpacity onPress={handleTogglePlayPause} style={{ marginRight: 40,marginLeft:30}}>
              <Image
                source={isPlaying ? require('./images/pause.png') : require('./images/play.png')}
                style={{ width: 30, height: 30}}
              />
            </TouchableOpacity>
  
    {/* 반복 재생 토글 버튼 */}
    <TouchableOpacity onPress={toggleLooping} style={{ marginRight: 20 }}>
    <Image
      source={isLooping ? require('./images/looping.png') : require('./images/nonloop.png')} // 이미지 경로는 실제 프로젝트 구조에 맞게 조정
      style={{ width: 30, height: 30 }}// 이미지 크기 조정
    /> 
     </TouchableOpacity>
     
  </View>
  
        </View>
        
       
        </View>
        </ScrollView>
    );
  };


const NewSongScreen = ({ route }) => {
  const { favoriteSongs } = route.params;
  const navigation = useNavigation(); 
  const [filteredSongs, setFilteredSongs] = useState(favoriteSongs);

  const navigateToImageDetail = (imageName) => {
    // 즐겨찾기된 항목 목록과 현재 선택한 이미지 이름을 전달합니다.
    navigation.navigate('ImageDetails_New', { imageName, favoriteSongs });
  };




  // 즐겨찾기 해제 함수
  const removeFavorite = async (id) => {
    try {
      // AsyncStorage에서 즐겨찾기 상태를 가져옵니다.
      const storedFavorites = await AsyncStorage.getItem('favorites');
      const favorites = storedFavorites ? JSON.parse(storedFavorites) : {};

      // 해당 ID의 즐겨찾기 상태를 해제합니다.
      delete favorites[id]; // 객체에서 해당 ID 프로퍼티 삭제

      // 새로운 즐겨찾기 상태를 AsyncStorage에 저장합니다.
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));

      // 화면에 표시되는 즐검찾기 목록을 업데이트합니다.
      setFilteredSongs(prevSongs => prevSongs.filter(song => song.id !== id));
    } catch (error) {
      console.error('Error removing favorite', error);
    }
  };


  return (
    <View style={styles.container}>
<FlatList
  data={filteredSongs}
  renderItem={({ item }) => (
    <Swipeout
      right={[
        {
          component: (
            <TouchableOpacity
              onPress={() => removeFavorite(item.id)}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}
            >
              <Image
                source={require('./images/BookMark_disable.png')} // Specify the path to your image
                style={{ width: 25, height: 25, alignSelf: 'center' }} // Adjust width and height as needed, align image to center
              />
            </TouchableOpacity>
          ),
          onPress: () => removeFavorite(item.id),
        },
      ]}
      autoClose={true}
    >
      <TouchableOpacity onPress={() => navigateToImageDetail(item.name)}>
        <View style={styles.itemContainer}>
          <Text style={[styles.itemName2, { fontWeight: 'bold' }]}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeout>
  )}
        keyExtractor={(item) => item.id.toString()}        
        contentContainerStyle={{ paddingVertical: 5,}}
        ItemSeparatorComponent={() => <View style={styles.separator} />} // 구분선 추가
      />
    </View>
  );
};

const Stack = createStackNavigator(); 

const App = () => {

  //글꼴 추가
  useEffect(() => {
    loadFonts();
  }, []);

  return (
    <View style={{ flex: 1 }}>
    <NavigationContainer>
    <StatusBar hidden={false} translucent={true} style="light"/>
      <Stack.Navigator 
      initialRouteName="Opening" 
      screenOptions={({ route, navigation }) => ({
        // route.params.direction을 기반으로 애니메이션 설정을 조건부로 변경
        gestureDirection: route.params?.direction === 'back' ? 'horizontal-inverted' : 'horizontal',
        headerShown:false
      })}      
      >
      <Stack.Screen name="Home" component={HomeStack} />

      <Stack.Screen name="ImageDetailScreen" component={ImageDetailScreen}

      />
      <Stack.Screen name="ImageDetails_New" component={ImageDetails_New} />

        <Stack.Screen name="Opening" component={OpeningScreen} />
        {/* 새로운 찬송 화면을 추가 */}
        <Stack.Screen 
          name="더욱 소중히 불러보고 싶은 찬송"
          component={NewSongScreen}
          options={{

            headerBackTitle: '목록',
            headerTintColor: 'white',
            headerTitleStyle: {
              fontSize: 24,
              fontFamily:'HakgyoansimBareonbatangB',
            }, 
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </View>
  );
};


const HomeStack = () => {
  const [favorites, setFavorites] = useState([]); // favorites 상태 추가

  useEffect(() => {
    loadFavorites(); // 초기에 즐겨찾기를 로드하는 함수 호출
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites !== null) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites', error);
    }
  };



  return (
    <Stack.Navigator initialRouteName="찬송 목록" screenOptions={{
      headerTitleStyle: {
        fontSize: 25,

      },
      headerBackground: () => (
        <Image
          source={require('./images/coverImage.png')} // 배경이미지
          style={{ width: '100%', height: '110%' }} // 이미지가 헤더 전체를 채우도록 설정
        />
      ),
    }}>
      <Stack.Screen
        name="목록"
        options={({ navigation }) => ({
          headerTitle: '언덕 위의 찬송',
          headerTitleStyle: {
            fontSize: 30,
            fontFamily:'HakgyoansimBareonbatangB',
            color: 'white',
            
            bottom:3
          },
          headerTitleAlign: 'center',
        })}
      >
        {(props) => <HomeScreen {...props} />}
      </Stack.Screen>

      {IMAGE_DATA.map((item) => (
        <Stack.Screen name={item.name}       
          component={ImageDetailScreen}
          key={item.id}
          options={{
            headerTintColor: 'white',
            headerTitleStyle: {
              fontSize: 23, // 헤더 타이틀의 폰트 사이즈를 15로 설정
            },
            }} />
      ))}


      {/* '새로운 찬송' 화면을 추가 */}
      <Stack.Screen
        name="더욱 소중히 불러보고 싶은 찬송"
        component={NewSongScreen}
        options={{
          headerTintColor: 'white',
          headerBackTitle: '목록',
          headerTitleStyle: {
            fontSize: 18, // 헤더 타이틀의 폰트 사이즈를 15로 설정
            fontFamily:'HakgyoansimBareonbatangB',
          },
        }}
      />
      <Stack.Screen
        name="ImageDetail"
        component={ImageDetailScreen}
        options={({ route }) => ({
          headerBackTitle: '목록',
          headerTintColor: 'white',
          headerTitleStyle: {
            fontSize: 23,
            fontFamily:'NotoSansKR-Regular',

          },
        })}
      />
    </Stack.Navigator>
  );
};
export default App;