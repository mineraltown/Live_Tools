#!/usr/bin/env python3

# 导入一堆也不知道用得着还是用不着的模块
# import ssl
import json
import pathlib
import asyncio
import logging
import websockets

# 这句好像是初始化日志的基本配置
logging.basicConfig()

# 给用户一个家
USERS = set()

# 读档
# 目录就是当前目录
path = pathlib.Path.cwd()

# 如果有存档就读取
if (path / 'SAVE.json').is_file():
    with open(path / 'SAVE.json', 'r', encoding='utf-8') as f:
        SAVE = json.load(f)
# 如果没有就生成一个新的
else:
    SAVE = {
        "year": 1,
        "month": 0,
        "day": 1,
        "advance_day": 7,
        "name": "Pite",
        "birthday_month": 0,
        "birthday_day": 1,
        "animal": {
            "chicken": 0,
            "rabbit": 0,
            "animal_1": 0,
            "animal_2": 0,
        }
    }

# 存档
def save():
    with open(path / 'SAVE.json', 'w', encoding='utf-8') as f:
        json.dump(SAVE, f)


# 全局变量
MOON = ("春", "夏", "秋", "冬")

# 加载游戏信息 网络版
# import requests
# Resident = json.loads(requests.get('https://wiki.mineraltown.net/saikai/Plus/Resident.json').text)
# Festival = json.loads(requests.get('https://wiki.mineraltown.net/saikai/Plus/Festival.json').text)
# Cookbook = json.loads(requests.get('https://wiki.mineraltown.net/saikai/Plus/Cookbook.json').text)

# 加载游戏信息 本地版
# 居民信息
with open(path / 'Resident.json', 'r', encoding='utf-8') as f:
    Resident = json.load(f)
    for i in Resident:
        if i['birthday']['month'] == MOON[SAVE["birthday_month"]] and i['birthday']['day'] == SAVE["birthday_day"]:
            if i['birthday']['day2'] != None:
                i['birthday']['day'] = i['birthday']['day2']
# 节日信息
with open(path / 'Festival.json', 'r', encoding='utf-8') as f:
    Festival = json.load(f)
# 菜谱信息
with open(path / 'Cookbook.json', 'r', encoding='utf-8') as f:
    Cookbook = json.load(f)

# 下一天
def next():
    # 声明全局变量
    global SAVE, DATA
    # 如果明天不是31号
    if SAVE["day"] + 1 <= 30:
        # 明天等于今天加一
        SAVE["day"] += 1
    # 否则
    else:
        # 明天是1号
        SAVE["day"] = 1
        # 如果下个月不是春天
        if SAVE["month"] + 1 < 4:
            # 下个月等于这个月加一
            SAVE["month"] += 1
        # 否则
        else:
            # 下个月是春天
            SAVE["month"] = 0
            # 同时还要再加一年
            SAVE["year"] += 1
    # 动物怀孕天数-1
    for i in SAVE["animal"]:
        if SAVE["animal"][i] != 0:
            SAVE["animal"][i] -= 1
    # 写一下今天是第几天
    print("第" + str(SAVE["year"]) + "年" +
          MOON[SAVE["month"]] + str(SAVE["day"]) + "日")
    # 保存游戏信息
    save()

# 计算今天有啥活动以及n天内有没有啥活动
def data():
    # 数据存在DATA里
    DATA = {
        'cookbook': None,
        'birthday': [],
        'festival': [],
        'advance_birthday': [],
        'advance_festival': []
    }
    # 看电视拿菜谱
    for i in Cookbook:
        if i['year'] == SAVE["year"] and i['day'] == SAVE["day"] and i['month'] == MOON[SAVE["month"]]:
            DATA['cookbook'] = i
    # 居民生日
    for i in Resident:
        if i['birthday']['day'] == SAVE["day"] and i['birthday']['month'] == MOON[SAVE["month"]]:
            DATA['birthday'].append(i)
    if len(DATA['birthday']) == 0:
        DATA['birthday'] = None
    # 节日事件
    for i in Festival:
        if i['day'] == SAVE["day"] and i['month'] == MOON[SAVE["month"]]:
            DATA['festival'].append(i)
    if len(DATA['festival']) == 0:
        DATA['festival'] = None
    # 提前提醒 居民生日
    # 提前 advance_day 天提醒，用一个 for 循环，实现从 1 天到 advance_day 天递增。
    for n in range(1, SAVE["advance_day"]+1):
        # 如果下个月是春天
        if SAVE["month"] == 3:
            next_month = 0
        # 否则，下个月等于这个月加一
        else:
            next_month = SAVE["month"]+1
        # 然后用一个循环开始判断居民是不是n天内生日
        for i in Resident:
            # 如果居民这个月过生日
            if i['birthday']['month'] == MOON[SAVE["month"]]:
                # 如果 居民生日 减 今天 等于 n ， 添加到准备过生日的居民列表中。
                if i['birthday']['day'] - SAVE["day"] == n:
                    i['n'] = n
                    DATA['advance_birthday'].append(i)
            # 如果居民下个月过生日，就给居民生日+30天再减去今天
            elif i['birthday']['month'] == MOON[next_month]:
                if i['birthday']['day'] + 30 - SAVE["day"] == n:
                    i['n'] = n
                    DATA['advance_birthday'].append(i)
    if len(DATA['advance_birthday']) == 0:
        DATA['advance_birthday'] = None
    # 提前提醒 节日事件
    # 提前 advance_day 天提醒，用一个 for 循环，实现从 1 天到 advance_day 天递增。
    for n in range(1, SAVE["advance_day"]+1):
        # 如果下个月是春天
        if SAVE["month"] == 3:
            next_month = 0
        # 否则，下个月等于这个月加一
        else:
            next_month = SAVE["month"]+1
        # 然后用一个循环开始判断居民是不是n天内生日
        for i in Festival:
            # 如果节日事件在这个月
            if i['month'] == MOON[SAVE["month"]]:
                # 如果 节日事件 减 今天 等于 n ， 添加到准备过节的列表中。
                if i['day'] - SAVE["day"] == n:
                    i['n'] = n
                    DATA['advance_festival'].append(i)
            # 如果居民下个月过生日，就给居民生日+30天再减去今天
            elif i['month'] == MOON[next_month]:
                if i['day'] + 30 - SAVE["day"] == n:
                    i['n'] = n
                    DATA['advance_festival'].append(i)

    if len(DATA['advance_festival']) == 0:
        DATA['advance_festival'] = None
    return DATA

# 当前字典数据转化为 JSON 格式，便于使用 WebSocket 发送
def value_event():
    value = {
        'SAVE':SAVE,
        'DATA':data()
        }
    return json.dumps(value)

# WebSocket 是一种在单个TCP连接上进行全双工通信的协议。
async def counter(websocket):
    # 声明全局变量
    global USERS, SAVE
    
    # 没问题的话了就执行这边的程序
    try:
        # 注册用户
        USERS.add(websocket)
        # 将当前状态发送给用户
        await websocket.send(value_event())
        # 管理状态更改
        async for message in websocket:
            # 解析客户端发来的 JSON 格式的数据
            event = json.loads(message)
            # 如果是 sucess 说明是初次握手
            if event["action"] == "sucess":
                print('连接成功，当前客户端数量：%s' % (str(len(USERS))))
                websockets.broadcast(USERS, value_event())
            # 如果是 heart 说明是心跳包
            elif event["action"] == "heart":
                websockets.broadcast(USERS, 'ok')
                
            # 如果是 next 就是下一天
            elif event["action"] == "next":
                next()
                websockets.broadcast(USERS, value_event())
            # 如果是 save 则保存传递来的数据
            elif event["action"] == "save":
                for i in SAVE:
                    SAVE[i] = event[i]
                websockets.broadcast(USERS, value_event())
            # 否则 报错
            else:
                logging.error("unsupported event: %s", event)
    # 出现问题就移除这个用户
    finally:
        USERS.remove(websocket)


# SSL加密
# ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# ssl_context.load_cert_chain("/etc/letsencrypt/live/pirate9.mineraltown.net/fullchain.pem",'/etc/letsencrypt/live/pirate9.mineraltown.net/privkey.pem')

# 永远奔跑的 WebSocket
async def main():
    # async with websockets.serve(counter, "0.0.0.0", 6789, ssl=ssl_context):
    async with websockets.serve(counter, "localhost", 6789):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
