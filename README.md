# Proximity Profile with Web Bluetooth API

---

[Web Bluetooth API で BLE デバイスにブラウザから接続する](http://tech.beatrobo.com/blog/2015/12/20/proximity-profile-with-web-bluetooth-api/) で利用しているソースコードです。

![](https://github.com/hideyuki/proximity-profile-with-web-bluetooth-api/raw/master/images/play.gif)

Proximity Profile (Link Loss Service, Immediate Alert Service, Tx Power Service) が搭載されている BLE デバイスと接続する Web Bluetooth API のサンプルコードです。

[https://proximity-web-bluetooth-api.herokuapp.com/](https://proximity-web-bluetooth-api.herokuapp.com/) で実際に試すことができます。

ES6でJSを記述し、BabelでES5に変換しています。
Web Bluetooth API をハンドリングしているコードは [proximity-profile.js](https://github.com/hideyuki/proximity-profile-with-web-bluetooth-api/blob/master/src/proximity-profile.js) です。
