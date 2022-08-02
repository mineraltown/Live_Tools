const app = Vue.createApp({
    data() {
        return {
            websock: null, //建立的连接
            lockReconnect: false, //是否真正建立连接
            timeout: 20 * 1000, //20秒一次心跳
            timeoutObj: null, //心跳心跳倒计时
            serverTimeoutObj: null, //心跳倒计时
            timeoutnum: null, //断开 重连倒计时
            season: [
                ["spring", "春"],
                ["summer", "夏"],
                ["autumn", "秋"],
                ["winter", "冬"],
            ],
            week: ["日", "一", "二", "三", "四", "五", "六"],
            animal_list: ["chicken", "rabbit", "animal_1", "animal_2"],
            year: 1,
            month: 0,
            day: 1,
            advance_day: 7,
            name: "",
            birthday_month: 0,
            birthday_day: 1,
            animal: {
                chicken: 0,
                rabbit: 0,
                animal_1: 0,
                animal_2: 0,
            },
            cookbook: "",
            resident: "",
            festival: "",
            set_data: false,
            set_birthday: false,
            loop: 0,
            f: ''
        }
    },
    created() {
        // 页面刚进入时开启长连接
        this.initWebSocket()
    },
    destroyed() {
        // 页面销毁时关闭长连接
        this.websocketclose()
    },
    methods: {
        // 重置数据
        reset_data() {
            this.year = 1
            this.month = 0
            this.day = 1
            this.advance_day = 7
            this.name = "Pite"
            this.birthday_month = 0
            this.birthday_day = 1
            for (let i in this.animal_list) {
                this.animal[this.animal_list[i]] = 0
            }

            this.save()
        },
        // 获取 JSON 格式数据并写入 data
        json_to_data(data) {
            var d = JSON.parse(data)['SAVE']
            this.year = parseInt(d["year"])
            this.month = parseInt(d["month"])
            this.day = parseInt(d["day"])
            this.advance_day = parseInt(d["advance_day"])
            this.name = d["name"]
            this.birthday_month = parseInt(d["birthday_month"])
            this.birthday_day = parseInt(d["birthday_day"])
            for (let i in this.animal_list) {
                this.animal[this.animal_list[i]] = parseInt(d["animal"][this.animal_list[i]])
            }
            this.f = JSON.parse(data)['DATA']
        },
        // 获取 JSON 格式数据并写入 data
        save() {
            let SAVE = {
                "action": "save",
                "year": this.year,
                "month": this.month,
                "day": this.day,
                "advance_day": this.advance_day,
                "name": this.name,
                "birthday_month": this.birthday_month,
                "birthday_day": this.birthday_day,
                "animal": this.animal
            }
            this.websocketsend(JSON.stringify(SAVE))
        },
        initWebSocket() {
            //建立连接
            this.websock = new WebSocket("ws://localhost:6789")
            //连接成功
            this.websock.onopen = this.websocketonopen
            //连接错误
            this.websock.onerror = this.websocketonerror
            //接收信息
            this.websock.onmessage = this.websocketonmessage
            //连接关闭
            this.websock.onclose = this.websocketclose
        },
        reconnect() {
            //重新连接
            var that = this
            if (that.lockReconnect) {
                return
            }
            that.lockReconnect = true
            //没连接上会一直重连，设置延迟避免请求过多
            that.timeoutnum && clearTimeout(that.timeoutnum)
            that.timeoutnum = setTimeout(function () {
                //新连接
                that.initWebSocket()
                that.lockReconnect = false
            }, 5000)
        },
        reset() {
            //重置心跳
            var that = this
            //清除时间
            clearTimeout(that.timeoutObj)
            clearTimeout(that.serverTimeoutObj)
            //重启心跳
            that.start()
        },
        start() {
            //开启心跳
            var self = this
            self.timeoutObj && clearTimeout(self.timeoutObj)
            self.serverTimeoutObj && clearTimeout(self.serverTimeoutObj)
            self.timeoutObj = setTimeout(function () {
                //这里发送一个心跳，后端收到后，返回一个心跳消息
                if (self.websock.readyState == 1) {
                    //如果连接正常
                    self.websock.send(JSON.stringify({
                        action: "heart"
                    }))
                } else {
                    //否则重连
                    self.reconnect()
                }
                self.serverTimeoutObj = setTimeout(function () {
                    //超时关闭
                    self.websock.close()
                }, self.timeout)
            }, self.timeout)
        },
        websocketonopen() {
            //连接成功事件
            this.websocketsend(JSON.stringify({
                action: "sucess"
            }))
            //提示成功
            console.log("连接成功")
            //开启心跳
            this.start()
        },
        websocketonerror(e) {
            //连接失败事件
            //错误
            console.log("WebSocket连接发生错误")
            //重连
            this.reconnect()
        },
        websocketclose(e) {
            //连接关闭事件
            //提示关闭
            console.log("连接已关闭")
            //重连
            this.reconnect()
        },
        websocketonmessage(event) {
            //接收服务器推送的信息
            //打印收到服务器的内容
            if (event.data != "ok") {
                // 导入data
                this.json_to_data(event.data)
            }
            //收到服务器信息，心跳重置
            this.reset()
        },
        websocketsend(msg) {
            //向服务器发送信息
            this.websock.send(msg)
        },
        // 修改季节
        switch_month(i, mode) {
            this[mode] = parseInt(i)
            this.save()
        },
        // 修改年份（button）
        switch_year(i) {
            if (i == "add") {
                this.year += 1
            } else if (i == "sub") {
                if (this.year > 1) {
                    this.year = parseInt(this.year) - 1
                }
            }
            this.save()
        },
        // 修改年份（input）
        change_year(e) {
            var INT = new RegExp("^[1-9][0-9]*$")
            if (e.target.value == "") {
                this.year = 1
            } else if (INT.test(e.target.value)) {
                this.year = parseInt(e.target.value)
            } else {
                e.target.value = parseInt(this.year)
            }
            this.save()
        },
        // 修改天数（button）
        switch_day(i, mode) {
            let n
            if (mode == 'advance_day') {
                n = 0
            } else {
                n = 1
            }
            if (i == "add") {
                if (this[mode] + 1 <= 30) {
                    this[mode] += 1
                } else {
                    this[mode] = n
                }
            } else if (i == "sub") {
                if (this[mode] - 1 < n) {
                    this[mode] = 30
                } else {
                    this[mode] -= 1
                }
            }
            this.save()
        },
        // 修改天数（input）
        change_day(e, mode) {
            let n
            let INT
            if (mode == 'advance_day') {
                n = 0
                INT = new RegExp("^[0-9][0-9]*$")
            } else {
                n = 1
                INT = new RegExp("^[1-9][0-9]*$")
            }
            if (e.target.value == "") {
                this[mode] = n
            } else if (INT.test(e.target.value)) {
                if (e.target.value > 30) {
                    this[mode] = 1
                } else if (e.target.value < n) {
                    this[mode] = n
                } else {
                    this[mode] = parseInt(e.target.value)
                }
            } else {
                e.target.value = parseInt(this[mode])
            }
            this.save()
        },
        // 修改玩家姓名
        change_my_name(e) {
            this.name = e.target.value
            this.save()
        },
        // 动物妊娠_长按开始的时候
        set_animal_start(e) {
            // 刚开始按时触发
            if (this.animal[e] == 0) {
                if (e == "chicken") {
                    this.animal[e] = 3
                    console.log(e + ': 将一个鸡蛋放入孵蛋箱')
                } else if (e == "rabbit") {
                    this.animal[e] = 5
                    console.log(e + ': 对安哥拉兔使用了人工配种器。')
                } else {
                    this.animal[e] = 21
                    console.log(e + ': 对牛/羊/羊驼使用了人工配种器。')
                }
                this.save()
            }
            let then = this
            // 清理掉计时器，防止重复注册定时器
            clearTimeout(this.loop)
            this.loop = setTimeout(function () {
                // 按过的0.5秒后触发
                then.loop = 0
                then.animal[e] = 0
                then.save()
                console.log(e + ': 取消了妊娠状态。')
            }, 500)
        },
        // 动物妊娠_长按松手的时候
        set_animal_end(e) {
            // 松手就清理掉计时器，也就是如果长按时间没到0.5秒，则取消长按事件的触发
            clearTimeout(this.loop)
        },
        // 下一天
        next() {
            // let save = this.SAVE()
            // save['action']= "next"
            // this.websocketsend(JSON.stringify(save))
            this.websocketsend(JSON.stringify({
                "action": "next"
            }))
        },
    },
})
const vm = app.mount('#live')