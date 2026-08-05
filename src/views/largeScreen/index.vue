<template>
  <div class="demo-container">
    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 地图容器 -->
      <div class="map-container">
        <div ref="mapContainer" class="map-wrapper">
          <!-- 加载中遮罩 -->
          <div v-if="loading" class="loading-mask">
            <el-spin size="large">加载中...</el-spin>
          </div>
        </div>
        <div class="header" :style="{ paddingTop: `${headerRatio}%` }">
          <!-- 1 -->
          <div class="header-left">
            <nav class="nav" style="justify-content: flex-end">
              <a v-for="item in navItems" :key="item.key" :class="['nav-item-left', { active: item.key === activeNav }]"
                @click="liftActiveNav(item)">
                <span style="transform: rotateY(180deg)">
                  {{ item.label }}</span>
              </a>
            </nav>
          </div>
          <!-- 2 -->
          <div class="header-title">
            <h1>无人机管理系统</h1>
            <p>UAV management system</p>
          </div>
          <!-- 3 -->
          <div class="header-right">
            <nav class="nav">
              <a v-for="item in subNavItems" :key="item.key"
                :class="['nav-item', { active: item.key === activeSubNav }]" @click="rightActiveSubNav(item)">
                {{ item.label }}
              </a>
            </nav>
          </div>
        </div>

        <div class="largeScreenInfo">
          <!-- 左侧控制面板，浮动在地图上层 -->
          <div class="floating-panel">
            <el-card class="control-card">
              <!-- 控制面板 -->
              <div>
                <aside class="contentArea-left">
                  <div class="sidebar-header">
                    <div class="routeList">
                      <img
                        src="data:image/png;base64,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"
                        alt="" />
                      <h2>
                        {{
                          currentShowNav === "device" ? "设备列表" : "航线列表"
                        }}
                      </h2>
                    </div>
                    <div v-show="currentShowNav === 'route'
                        ? !isDrawing && activeNav === 'route'
                        : true
                      " class="routeListAdd" @click="
                        currentShowNav === 'route'
                          ? startDrawing()
                          : startDrawingEquipment()
                        ">
                      + 新增
                    </div>
                    <div v-show="isDrawing && activeNav === 'route'" class="routeListAdd" type="primary" @click="">
                      <span style="margin-right: 12px" @click="cancelDrawing2">取消</span>
                      <span @click="finishDrawing">完成</span>
                    </div>
                  </div>
                  <p style="
                      height: 20px;
                      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAAXCAYAAAB6bJZRAAAAAXNSR0IArs4c6QAAFchJREFUeF7tncuO3EaWhv+4kHktleS2xgMDDczCmIUavfJitn6Jfp9+NL/ALG0MGl40MIC7jR7YkqW6ZCYZMf2fOIcZyWJWlS5lldCZdoFkMBiM5OXL/1wi5MBPzk6W9vkzyvYfdPlcl7r/67/AXT0rZd8/R3rxD/jFL8ivNvD46qAldD/tj41fINfb3arsS7/A4UsAPwL9Ai5cIXN52BKQ5nD5NRw+B55s4F+ukZ++majX3Cwbt/Wu236HzPPa8Tx/auBYzjLbN9UvO2Y4/mcAnwE8Nr2G85t9u1bXne3L/PV+vb5GXB9/H/9sXxYvqvUvyrrdB96T9s3N43k/7R5PXSvuP3YN//s/j+z7x6j8u2qbzxq37Zlj4/X+d71hPO7Px/sqzTp39Lu8z2lPxz7+K1AgYwA08Fm/+TA+hyPwWDR+IS4v4JcrJC7lpTKgVfDqCTcA4RmyrQv0FGZ8wfMMTgBwhixg2yJ/xjrtHmSEDP/k2Eu4HPf7cgPndsj5Gi5FOL8oD3y6KutcctvWx0vbZ1+7Ps7akvar8wyAmu/L5VJel3O5+f6lk7IzAK8PH4i6jutKfb88fFkNrPzOsUGqIWqQ5fWycl5DOX8F0wNwKhjr++InAFpD09rm/R2XE6C2vwbpbYBk/RuQNDjaj+0YlnaSDwHFExAfP5l+ox4eB2Cl/gyAr34Pz4d8u4ajgjDgCWwWcDXgBsgp3Lj9tN2rJQHa5aFSM8CN4UZwEGyLDv5yjrxUyBzUCxNKcPt+StC3+5fb9RPqrEOu+0CIcduWAkTtV9rCsT1bDgDtkVnHRyRc7O86v+f4GRggqbA00Fq5AFSVaA3TumwMS/7whHYPVoNl/YMlCvNLoAYlQWj3n+vvAkJCkM/WUcXIL/GxQHhShb8Rgj7uaaYBOIKfKT+Cj929fgNfA49qzr4G1Zys/x/wlPBT6AkQFXpUObWKM9UkKkmVm4Flze0Alzp4wsOAYkuBzBh0hA7hVZcTYHV5vd/22ZewbYWea5Hrc3B76rbVkBz6WfdhDWftSN0RYLnPhz2MBHDaB4OxbK8A96r0gaA8AOAIjtJGVXYMkL5SkS8rs1uOVzXZLJD4I0c4jlVjDcT5Gok/kGZeb/8O1/77cTO7NrfHyvGoUqxvwIdQhWzvmDI8wfDjUuoBz74H4Njvx5M+h6N/z8Bnqo/w426+DP05/FP65fRzw2y93JuuAis1XWlOmmm60rI32oZBL2/g+h6eMElctvAzhWD2amqm8mLZdu60LzMAm9Ig93mPNECT5TMg79Q09kgpwbuEbHW5zWMGsGu7LiJPAvEacA0yrgHMi/Iz2LFP0j/2Sc8J7bccU4GOfbBzEnabFpnfeTsGY0ASYK6RpN8bvR49cg1Lg58pyrGKpBk+lKl6NDPcYEk40l0pPsrP7zav6culD3KsEsfPsanGKR8k694JQ1aaUojvA8STefyAuHl8TR8HYAU/c5jXPr4x/MZKbwAiAbgoPkLzoxF8hF7fwbvZ/uU1QPHF5zrhR/BRubVNWRewsIxg6+AIJIOcwE/BWF/qRuFFCBEWWwAN1/VYq7vdAm17/CbtKjiB4CLMKoBJfwgj/kAo6Hge6Rfb5YnZvxpyur5jXxKyAXDom4GS+wjfCUAemOeVamV5rSBtndec5rafI/NHhwAUX6f6KM03eRcYeaVoUpvfkap/HLShWqyv6JRyrEHIH9sxEI/5Ewd1+BBm8m0gPCnCx0eyd+zRTRN4wvytfX61+uM5JZihZi8DGObHk30NXL+FJ+gGJRWLObukqmPAokM2lWcv6KCeWMfAB4TWYMKlgs4gmBM8ywic3bYAzuoM18bBISODSwK0P/QRuoDMMlkqLA+uK4/lh6CbCcYyzytwNzARZKb4ZMf+XI4qVJUmFL4D8FRtDu1U4BM46sd1SALHESyHdhSAVI5yPfm3KKa0/BF+5LCaxVNQ5P4Lg6L+cMlXmQjUUCXK3xaZP4JjU5rmM/2KfE64HANR+qJBGAuwHItMj59xgnHSRL4tkPIQ6vAExHfEz8c/7BCA7E9tCmsEmD7AceDDfIDm/6shaPDrdvDiu4slast1wm1h61RyCyC9gc8rOFN+VHjtDo6waCJ8AgL/coA3aGUFS6PAGlRggu8UTAJArcf9sYez49CIOXrwGQCYkXcRaLpShVXlE5ClzhaeMOM2tE1HOBJKLKtMcmmA/YgsVAXHunp+govH7BSucjyPqQGp6o8KUs7LrrNsgSRQM/hWZrWVi0kfkLY7NefN98njFJI1FO0eGCyvNkhU6wSiwGqBTCU/hmENwvqi0p9IF8mrFukYAOv6hOE4qGL7j6Xr1Mc/uM/w5Cf8+NT6gD24Mwr89S/wYwAyb495ev1ur+zSDI5RXoHe7+DSDn6xK+ovBsS4RezmCDEjUNWFHaJvEEJGCAE+JHgufYBvgOg9fABiJDpyOc438DnBBbLEgclbzjEGkkVFotfyrqfgAfoElzJ84n4qmAJG2Zc8Mnx5kTtum7rTtqIvxwjk2FYNL0I1ILNM7gXb4vmtjh4j5zNA8yQ8n0cioEVREWLcDsiEc6fb0qbBzCMZXO2YjuqTH6or7jdfpR7Dsq1CkwrZ6tTms8C6KapQ/Iv0YVaqcYCj+hRpFjNYdaXR6tpMtrSiEJEOwPiqpPUMOZIaaKEvkabyZMSZJrP6EOVHayKHcfz8E4y3+gtvyz98l5fpBMF3uWqP8pjbAfgd3Is/lCDI9f/Ap1UB35lHENC1xY+36OHnc/jGIfQtvN8iLpaI8IgxoW085iFjMY+YNRHz1mPROLStx4xlbUQ784itQ5wFtDGiITQbh6YpgAzRIbgCxQI1kVkAYUJwdBmOL/2WiizT3Qi/65F3iRarwJDCKnUEXgKSQ+qcBD9S1yP39N1lpJSReroXCzQJOWKFx6F3si8lZk7qeTPQs45BjW05tk0e0vykgczzcJ3HOAla0HDO7IOqQqpJgTD7o17CLOBjfZ5XjkaO7BfLCKICXKnvCFd+F11y2/6T+uw+wSy0V/A6pCYh9wSowZcqdyumsgRXxO9ZgdlguqEarUxxQphKc4hkE6ZvkK+5DEWpCsA7ZAu8jNXkaypLzYOkypT6Bs0zZItG+3Pk9AqOy2D7R7mMoiJfI1v02SLR348TuJ8dRt3v9ZbSjD5B8F6X6rFXcjeSoM0H+J2MznBfbeCvO4GJ7xP8k6fw2wuEeURoA0LjEXyPmKOArl3M0AaHdhEwa1vM24jl3GO9bHC2aHC+jDhft3iybLBaRSzXcyyWDWbLiGbRIC482iYizKKov0DgRZ6D4Q2+EDQnMzzfDgWRKME+U1DBiepLCH2G3xJ+vfw5qkSamZsOecPyhLTti1KSZYd8zfWEtOuRrnu4Ddczeu7blXIeK1DoeiQuuZ/7BIKutEsxKHUSmUZaIiUnDGafiQIBbeY3cUi5p9eQ1QSCybNMVktdKWZ9oJfINMvoT9R9hBs8+Sz1BayynuS8KbA9h04wp0DlOsEq4taXutzmcQLMURtyXHV83wuEe8cj2Yj8PpTzy7H8U4Dzx8HaM9UrwSgGdXZIboZeyqlIL8uSLVGFXlsgR9Up8yXrSPYA0yr/8XWDRHAyOENocvSQKU7mNI5HyTCZ317UG4DkDh3ZMuQsfiujpPLBSBUbyXIXGDno4OQzfDRcvAlAdu17OLwQ573/6ndwlz8jbC8RnnwG372E7z5HmG0Q2ojgV2hmPdrYYrYAlosGc++xWAYsZw1WBN2swdmqwfm8wdMnLZ6uZ3h6Nsf6vMXybI752QwNAbhsEVZNgV8bRe3RJBZD1FFHlZCCpdxwyVeMYCzePqtDa5dZf2UJqjeqxE0PEIqXhFsn4MPFDvmK8OuAqx7uYgdcJ6TrDu6KZQWYBKfb5FJPgEkYcj2LCU44iuuupwqDbNPUFjOZUKPoJLC5VEFK9UmfJKHTUVHy+xCUElxR4Al4ikEslnsq5i7DN70zOFLkZvSOICueAAGZANTqclvCM2VfciCve19A27lQAElAa7t9DuhcKm0QYCmjs3NIW4RmaT+5gJ7q1dk5gkCtqFfCkqa6tsMfD9egl4COQtLrj4bU45+qTjHneSaa4qoy5YmwoE6LHALSJbfNTxmRhiAPVeVCAzVL5F8vkI6NlhnnNw6+yB/K+1rnMkoAZgxHU5O3KUR79QnBEww/Ogj3ADSs8DXcD4kTuPwHA3VrhN0M4UkPv2sQ5jRLO0Tv0IQGsV2gbRKWMWAZHdazgFXrsGwDFrMWq+BxNot4smrwZBGwXrRYr5ui/lZNUX+rBu0yIs5axDlN4oAQitkbope8PG9KUOO5lE1FDRZzmEvRVT2tLUJJy1XFiam8SfBUdwKwHqDKEJD18ISeKkNHxSig6+HEnIaAj6DLBByVImGnJrjnUsxkLktfRKWJaVvgJjCUXcW0lv+5TVVHJUZoEXiq7mwfAURoCRidhF5E9bFeAV4xqwVqg3KkKjSoOewMVjyfc9ixLwIxHreHo0Aws31Vda7XdUKOsOsFkgJTU5umJhP31fAjzDr0VIuD6W2K0MDYIXWtqsBSXyLdBN8AQjWjaU6LJVCl+FwHpGPKUPyIDZJfI6c3cL/OkPzf1LwejbO+oQ6fI8fKtLZRUBaMMb/jQeCF/sapSDOVId+rU57hR4de3YEbEw4cTIzAG/YN/Itv4bf/BccRIBsgnG/htw5hTp/fHD50aEKQYAX9d3MHLIPDLAAz7zBzDvPgMOcyOiwCBJLzpkEbHVoGXGdRzOm2pe+PQZOy3vhiBkdPFciIJsMPgOdbruYlVZSYujRDqap6p4EO+vboM6O8oFOOCopwLNKIfj82QtM59W4IpIhKk/aL707WJcBCsNFXyEhwGpRdifoKNYppS9jxvMGhxGayBGyK2av+QwZvRPUVU5EgKb42J/BRz5vcjbKuZrHEedQUJTBpLtO/qCZmR9hKmZmghE0BGjMTi99QuzuYq6biin9RLhf3iSlsKo/HqV9RLmel0iQIw/q74mfkdxj8h5q7yGMEXhtgq0Eb+gw9o9MWje6LySvbmqAtoNOUHIs+W2DllfkJOTnFz4CZvLwf9A/ip/Kom7Jj5sI45cZeBprB9HX/8G9IEGkHvHgGd2AS/4j89Zc6dM/MYFY04NEM/tOET7FWe+OJR2pF+KjQ8K/RmbsBWM/O8RzuqysEgnB3DZ9+D5d/hVsnhG4BKqDQ7NC0c4Q+IXiC0SH2DtF3iDFIRJb7GucQQ0Toe0RRefSMEHQZnkvud15MX742Df2AAhoP74rZK0+aU9+gyAK1L6WeBFmL4Zg0wKCmk/FK6oiaYEBCVZqQjqDQnEEJVHCr1CunsfCCRpMlzkEAFFhIdFnqmd9MwskliCImX+lgiUKXZfGjVVFkLS+wU/iIL42BDP1PoroETtnPYI4oJv4UybKq7zsk5hPWeYcSnLBEbFVbTOwW6Og++uPoArDghgwDZMTYghocicL6b5CvLIrM6zHbJ2ETYIwQyzUkzDTQ8SvzBzWizUix+OtmcLYMcyRCzGa78X9EjvWMOX8t1/XYOOQBXvThGbCYI6iTe+BHmX3mcFjjWL3dNjvNlJo7+fc+KXLeDkB+lXqGmGp2GE6MUA+N48gQ5gSeMWevKekwHXP3mAPI3D9NhmZOoOUDMt+PeWo2ukMSnVmW4DkUDXM4SZvZIeQWLm417YY5dEw21vQZicBasp6O+mBaCctolo4TnoccQBuVYTl5fBl5vCYz10nTlpcnL7GNm9U8QIEQgx6WsFw8dpIqM6SzcN+upL4MSdajZGhRgFWZBAks4bneR5+Y9r0eSkdQSf8IMda3CRxqMGliNK5AaV2isyvgkv6zi/0sNoGBBFNYHLv9MzzNTJqTNv0Xx3OLGlsjv/xpD5Kxj208G814UoXbIHbXcLiDyRSOjQgZv5IPkQwtF/40rdYnRT8NGhzv89Q8gRUE60kSCMPt5wVQuyt4Rt4sN/Bg5pdzgKNDRPEoFA2SSx0eJ4DkJAI6EoRjdgnFthpipmpQyuUL6JC0YaxtNVROEqJ1dAijs9y2kWny3BI6HKZWF2r5eMzxcLEIm2q88TB0je3ox9JEBFYKJYPf5OwyjIxWY36HSRfU32Vjf7m0RGU6+y1Hr041sUkSbHYaCwrUN5tAqydH4L56HHA9c4zsq/L3bGSHtWcjPG6F2w83Awk8nj+m5/+LxOfpLuDJ+Qg6Krl6yfLaFH0fyB17I07D4z41vt3Z35sKcHzIFAS/KdCp5wm0kSIsH48ZZpkNmeNwOdkeT4d1Xk5sQ+cEitdwy3M4KhMZF9wWMA6TEehUU1SQNoJBwDiaHWYW4DY9si3teG6z/sbgtIWbz4FrTmhAAOosMJYUXM9AU4+YOLhk1bRZx47jscemxrK2RJEBWK1KCaOc0idNSKZC4yw5/mUB4Pi2makpKo2mZpWQXNe1sbw2IauN5R1PvioA1HG9nO2FbpD7THZw2xyBQ/CAJumxqbHuo+qOBR3qL2oBiPGcl3e+Iv+scALffa7SJ1nn5lA4ectUyt93pmj6V74BzLdC53F9NZiE2p2VsnoWaCZV11NpCbw4hVYDl9/AnV+U6bT48tqwurpdG2InXda5+IapteqKhEg1155BxKpQeRpwbH1QVQqc8eSlpqykzzoH4PgJGNSZTqRq/RSY6JRgsk5T81xnhtY5EsXU1O8vddTsfrVSEK6ReY0k301naeFkBMNHZ205yIHTURZ1P+ucOCu3JGLeMyYTs9xSQG6bKXpq3zBe156R+wDttlfpPsrurkjr20Lwrty+T/LVP3Va3ke5DMciU7ddIz5E+6TpQwVSO47ZRj2lvjqgDZI1HA2QHGpnL6ZNl99zXsFXOrGAJrZK19XUpt+pV3U57jYhQR+ilbsKHiyv99t6vazbY/0wQ7IZrA06MrN1NS2YXNyq7Iay+gKQKOV4qVFLDgeTD/+pgGrCgKlbYkqsXtb1DGJ12dT8fNxvgYOvOWszVT6XU8GCcUeYOM8fwcPoqJUlUVF1GsgYQjVk3gZQd8Hubd7z2/pUt3Py9b3NVX3UdUse4DHFd6zrFtav90893PZwTj3Qh9G1AqcvD5VjrSRtKFMNTHuxTV1Oddemca+XVm+YfeQ1srXBNsftTZ3H6k3BxdonZNjfMXjq73IXiOwaTI1QsDQNQmrqQ3BJ2gYBZnCyiox+1rOm2Pq3R4aG2UiH8YkMbCy/rc5DvQZTz+JDnYvtnuD3kFf3N2/7bh/gfbv0tiryPr/yYyU5/kdz2Dcqj/LyFRVqzvF6H8E6BYEaBla/DHHaX5ebaRIyRBDjMaQ8ZnxsydQZpgI76Gd9vrL+4f9BoFp13ScJ9773+rHUe18Y3fXMvm/7j+U6nfpx9Ap8OACOT2HK8q6H7EPfnKkXvXaA38dkuqv+Y4PJ6UX90E/Rqb1/kSvw/0xKAvm22PzPAAAAAElFTkSuQmCC);
                    "></p>

                  <!-- 搜索框根据当前显示类型动态变化 -->
                  <div class="search-bar" v-show="currentShowNav === 'route'">
                    <el-input class="hangxianliebiao" v-model="routeSearchKey" placeholder="请输入航线关键字查询"
                      @keydown="routeEnterSearch" clearable :suffix-icon="Search" />
                  </div>
                  <div class="search-bar" v-show="currentShowNav === 'device'">
                    <el-input class="hangxianliebiao" v-model="equipmentSearchKey" placeholder="请输入设备关键字查询"
                      @keydown="equipmentEnterSearch" clearable :suffix-icon="Search" />
                  </div>
                  <!-- 航线列表 -->
                  <div v-show="currentShowNav === 'route'" v-for="(item, index) in routeInfo" :key="index">
                    <el-card class="control-card" v-for="(itemInfo, indexInfo) in item" :key="indexInfo">
                      <template #header>
                        <div class="routListTitle">
                          <div>
                            <span>{{ itemInfo.name }}</span>
                          </div>
                          <div>
                            <span class="routListCheck" @click="viewRoute(itemInfo)">查看</span>
                            <!-- <span class="routListCheck"
                                                            @click="routeEdit(itemInfo)">编辑</span> -->
                            <span class="routListDelect" @click="deleteRoute(itemInfo)">删除</span>
                          </div>
                        </div>
                        <el-button class="globalSettings" type="primary">全局设置</el-button>
                      </template>
                      <div style="
                          max-height: 200px;
                          overflow-y: auto;
                          scrollbar-width: thin;
                          scrollbar-color: rgb(88 130 179) rgba(80, 80, 80, 0.4);
                        ">
                        <div class="routeListContent" v-for="(
itemPrototype, indexPrototype
                          ) in itemInfo.points" :key="indexPrototype">
                          航点 {{ indexPrototype + 1 }}
                          {{
                            indexPrototype === 0
                              ? "(起点)"
                              : indexPrototype === itemInfo.points.length - 1
                                ? "(终点)"
                                : ""
                          }}
                          <div class="routEdit" @click="
                            editAirline(itemPrototype, indexPrototype + 1)
                            ">
                            编辑
                          </div>
                        </div>
                      </div>
                    </el-card>
                  </div>
                </aside>
              </div>
            </el-card>
          </div>
          <div class="floating-panel">
            <!-- 信息概览 -->

            <aside class="contentArea-right">
              <div class="info-card">
                <el-button class="infoOverview" type="primary">信息概览</el-button>
                <div class="stats">
                  <div class="stat-item">
                    <span> 2台</span>
                    <span class="value">无人机设备数量</span>
                  </div>
                  <div class="stat-item">
                    <span> 0台</span>
                    <span class="value">在线数量</span>
                  </div>
                  <div class="stat-item">
                    <span> 2台</span>
                    <span class="value">离线数量</span>
                  </div>
                  <div class="stat-item">
                    <span> 150条</span>
                    <span class="value">告警信息总数量</span>
                  </div>
                  <div class="stat-item">
                    <span> 8条</span>
                    <span class="value">已处理</span>
                  </div>
                  <div class="stat-item">
                    <span> 142条</span>
                    <span class="value">待处理</span>
                  </div>
                </div>
              </div>
            </aside>
            <!-- </el-card> -->
          </div>
        </div>
        <!-- 保存路线弹窗 -->
        <el-dialog v-model="saveDialogVisible" title="保存路线" width="30%">
          <el-input v-model="newRouteName" placeholder="请输入路线名称" clearable />
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="saveDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="saveRoute2">保存</el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 删除确认弹窗 -->
        <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%" type="warning">
          <p>确定要删除这条航线吗？此操作不可恢复。</p>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="deleteDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="confirmDelete">删除</el-button>
            </span>
          </template>
        </el-dialog>
        <!-- 编辑对话框 -->
        <el-dialog v-model="waypointSettingVisible" title="航点设置" width="25%" type="warning"
          style="max-height: 80%; overflow-y: auto">
          <el-form :model="formData" label-width="130px">
            <!-- 1. 只读字段：航点序号、经纬度 -->
            <el-form-item label="航点序号:">
              <el-input v-model="formData.waypointNumber" placeholder="请输入航点序号" />
            </el-form-item>
            <el-form-item label="是否使展示参数:">
              <el-radio-group v-model="formData.whetherDisplay">
                <el-radio value="0" :label="true">是</el-radio>
                <el-radio value="1" :label="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="经度(度):" v-show="formData.whetherDisplay === '1' ? false : true">
              <el-input v-model="formData.routeLongitude" />
            </el-form-item>
            <el-form-item label="纬度(度):" v-show="formData.whetherDisplay === '1' ? false : true">
              <el-input v-model="formData.routeLatitude" />
            </el-form-item>
            <el-form-item label="停留时间(秒):" v-show="formData.whetherDisplay === '1' ? false : true">
              <el-input v-model="formData.residenceTime" />
            </el-form-item>
            <el-form-item label="转弯半径(米):" v-show="formData.whetherDisplay === '1' ? false : true">
              <el-input v-model="formData.turningRadius" />
            </el-form-item>
            <el-form-item label="航向角(度):" v-show="formData.whetherDisplay === '1' ? false : true">
              <el-input v-model="formData.headingAngle" />
            </el-form-item>
            <el-form-item label="航点飞行高度(米):" v-show="formData.whetherDisplay === '1' ? false : true">
              <el-input v-model="formData.flightAltitude" />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="waypointSettingVisible = false">取消</el-button>
              <el-button type="primary" @click="editWaypoint">确认</el-button>
            </span>
          </template>
        </el-dialog>
        <!-- 保存路线 -->
        <el-dialog v-model="saveRouteDialogVisible" title="保存路线" width="25%" type="warning"
          style="max-height: 80%; overflow-y: auto">
          <el-form ref="saveRouteFormRef" :model="saveRouteForm" :rules="saveRouteRules" label-width="90px">
            <el-form-item label="路线名称:" prop="name">
              <el-input v-model="saveRouteForm.name" placeholder="请输入路线名称" />
            </el-form-item>
            <el-form-item label="路线描述:" prop="description">
              <el-input v-model="saveRouteForm.description" placeholder="请输入路线描述" />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="saveRouteDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="confirmSaveRoute">确认</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, inject } from "vue";
import { ElMessage } from "element-plus";
// import { addRoute, getRouteList, deleteManageRoute } from "../../api/route.js";
import { statisticCount } from "@/api/statistic";
import { Search } from "@element-plus/icons-vue";
import headerBg from "../../assets/header-bg.png";
// 注入父组件提供的上下文
const collapseContext = inject("collapseContext", {
  isCollapse: ref(false),
});

// 解构出方法和状态（可选）
const { isCollapse } = collapseContext;
// 创建地图实例
const mapContainer = ref(null);
//地图实例
let map = ref(null);
//轨迹对象
let carTrack = null;
// 修改预设的轨迹点为空数组
const fixedTrackPoints = [];
// 轨迹点历史
const trackHistory = ref([fixedTrackPoints[0]]);
// 添加加载状态
const loading = ref(true);
// 添加绘制相关的状态
const isDrawing = ref(false);
//绘制的经纬度点
const drawnPoints = ref([]);
///创建绘制线
let drawingLine = null;
//新增
// 在导航配置部分添加
const activeSubNav = ref("overview"); // 当前激活的子导航项（默认平台总览）
// 航线关键字查询
const routeSearchKey = ref("");
// 设备关键字查询
const equipmentSearchKey = ref("");
//航点设置编辑对话框
const formData = ref({
  waypointNumber: "", //航点序号
  whetherDisplay: "1", //是否使展示航线参数
  routeLongitude: "", //航线经度
  routeLatitude: "", //航线纬度
  residenceTime: "", //停留时间
  turningRadius: "", //航向角
  headingAngle: "", //航线纬度
  flightAltitude: "", //航点飞行高度
});
//计算高宽比
const headerRatio = ref(0);
//转换后的路线数据
let newArr = ref([]);
//航线列表数据
let routeInfo = ref([
  [
    // {
    //     name: " 测试",
    //     points: [
    //         {
    //             lat: 39.91079,
    //             lng: 116.43637,
    //             alt: 30,
    //         },
    //         {
    //             lat: 39.90658,
    //             lng: 116.45576,
    //             alt: 30,
    //         },
    //         {
    //             lat: 39.89117,
    //             lng: 116.44855,
    //             alt: 30,
    //         },
    //     ],
    // },
  ],
]);
// 路线列表
const routes = ref([
  // 示例数据
  // {
  //     id: 1,
  //     name: "城市观光路线",
  //     points: [
  //         { lng: 116.481028, lat: 39.921983 },
  //         { lng: 116.494458, lat: 39.908823 },
  //         { lng: 116.489261, lat: 39.897262 },
  //         { lng: 116.474868, lat: 39.909405 },
  //     ],
  // },
]);
// 高德地图API密钥
const AMAP_KEY = "8caa48f96ee6d3e3e693f5a0fe2bf787";
// 保存路线对话框状态
const saveRouteDialogVisible = ref(false);
//保存路线 校验
const saveRouteFormRef = ref(null);
//保存路线 表单数据
const saveRouteForm = ref({
  name: "",
  description: "",
});
// 表单验证规则
const saveRouteRules = {
  name: [
    { required: true, message: "请输入路线名称", trigger: "blur" },
    { min: 1, max: 10, message: "长度在 1 到 10 个字符", trigger: "blur" },
  ],
  description: [
    { required: true, message: "请输入路线描述", trigger: "blur" },
    { min: 1, max: 20, message: "长度在 1 到 20 个字符", trigger: "blur" },
  ],
};
// 添加保存状态
const savingRoute = ref(false);
// 绑定地图点击事件
let drawingClickHandler = null;
//创建路线的id
let currentRouteId = 0;
//显示查看状态
const isViewing = ref(false);
//保存路线弹窗
const saveDialogVisible = ref(false);
//删除确认弹窗
const deleteDialogVisible = ref(false);
//编辑对话框
const waypointSettingVisible = ref(false);
//保存路线弹窗
const newRouteName = ref("");
//删除确认
const deletingRouteIndex = ref(-1);
//新的路线点
let newRoutePoints = ref([]);
//是否有保存的路线点
const hasTrack = computed(() => {
  return fixedTrackPoints.length >= 2 || drawnPoints.value.length >= 2;
});
// 导航配置
const activeNav = ref("route"); // 当前激活的导航项（航线管理）
//左侧菜单
const navItems = ref([
  { key: "monitor", label: "视频监控" },
  { key: "route", label: "航线管理" },
  { key: "device", label: "设备管理" },
]);
//右侧菜单
const subNavItems = ref([
  { key: "overview", label: "平台总览" },
  { key: "pilot", label: "飞手管理" },
  { key: "account", label: "账号管理" },
]);
// 新增：记录上次非监控页的导航项（用于监控页记忆）
const lastNonMonitorNav = ref(activeNav.value); // 初始值为默认导航项
// 计算属性：当前应显示的列表类型（监控页时使用上次记录，否则使用当前导航）
const currentShowNav = computed(() => {
  if (activeNav.value === "monitor") {
    return lastNonMonitorNav.value; // 监控页显示上次的列表
  }
  return activeNav.value; // 其他页显示当前导航对应的列表
});

// 动态加载高德地图 SDK
const loadAMapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_KEY}`;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

//高德地图
const initMap = async () => {
  try {
    // 先动态加载高德地图 SDK
    await loadAMapScript();
  } catch (error) {
    ElMessage.error("高德地图API加载失败，请检查网络连接");
    loading.value = false;
    return;
  }
  try {
    // 创建地图实例
    map = new AMap.Map(mapContainer.value, {
      zoom: 13,
      center: [116.481028, 39.921983],
      viewMode: "3D",
      showLabel: true, // 显示地名标注
    });
    // 添加卫星图层
    const satelliteLayer = new AMap.TileLayer.Satellite();
    // 添加路网图层
    const roadNetLayer = new AMap.TileLayer.RoadNet();
    // 添加到地图
    map.add([satelliteLayer, roadNetLayer]);
    // 地图加载完成事件
    map.on("complete", () => {
      loading.value = false;
      ElMessage.success("地图加载成功");
    });
    // 地图错误事件
    map.on("error", (e) => {
      console.error("地图加载错误:", e);
      loading.value = false;
      ElMessage.error("地图加载失败，请刷新页面重试");
    });
    // 尝试获取当前位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          map.setZoomAndCenter(15, [lng, lat]);
          ElMessage.success("已定位到当前位置");
        },
        (err) => {
          // 定位失败时使用默认中心点，不提示错误
          console.log("定位失败，将使用默认位置");
        },
      );
    }
  } catch (error) {
    console.error("地图初始化失败:", error);
    loading.value = false;
    ElMessage.error("地图初始化失败，请检查配置");
  }
};
// 转换函数：将原始数据项转换为目标格式的单个对象
const convertItem = (item) => {
  // 解析pointsJson获取路线点数据
  const pointsObj = JSON.parse(item.pointsJson);
  // 转换points数组（将lon转为lng）
  const convertedPoints = pointsObj?.routeData?.points?.map((point) => ({
    lat: point.lat, // 保留纬度
    lng: point.lon, // 经度字段从lon转为lng
    alt: point.alt, // 保留高度
  }));
  // 返回转换后的单个路线对象
  return {
    name: item.name, // 使用原始名称
    id: item.id,
    points: convertedPoints, // 转换后的点数组
  };
};
//航线列表
const routeList = async () => {
  const res = await getRouteList({
    // pageNum: 1,
    // pageSize: 20,
  });
  //将原始数据项转换为目标格式的单个对象
  let newRouteInfo = ref([res.data.list.map(convertItem)]);
  routeInfo.value[0] = newRouteInfo.value[0];
  console.log(routeInfo.value); // 输出转换后的结果
};

//航线列表查询
const routeEnterSearch = (e) => {
  console.log("routeEnterSearch", e);
};
//设备列表查询
const equipmentEnterSearch = (e) => {
  console.log("equipmentEnterSearch", e);
};
//新增
//左边导航栏
const liftActiveNav = (value) => {
  activeNav.value = value.key;
  if (value.key === "monitor") {
    //监控
    console.log("监控");
  } else if (value.key === "route") {
    //航线
    console.log("航线");
  } else if (value.key === "device") {
    //设备
    console.log("设备");
  }
};
//右边导航栏
const rightActiveSubNav = (value) => {
  activeSubNav.value = value.key;
  console.log(value);
  if (value.key === "overview") {
    //平台
    console.log("平台");
  } else if (value.key === "pilot") {
    //飞行
    console.log("飞行");
  } else if (value.key === "account") {
    //账号管理
    console.log("账号管理");
  }
};
//航线新增
const startDrawing = () => {
  if (!map || isDrawing.value || isViewing.value) return;
  isDrawing.value = true;
  // 创建绘制线
  drawingLine = new AMap.Polyline({
    path: [],
    strokeColor: "#c0274e",
    strokeWeight: 8,
    strokeOpacity: 0.8,
    lineStyle: "solid",
  });
  map.add(drawingLine);
  ElMessage.info("请在地图上点击添加航点");
  // 绑定地图点击事件
  drawingClickHandler = (e) => {
    if (!isDrawing.value) return;
    const point = {
      lng: e.lnglat.lng,
      lat: e.lnglat.lat,
    };
    drawnPoints.value.push(point);
    // 更新绘制线
    drawingLine.setPath(
      drawnPoints.value.map((p) => new AMap.LngLat(p.lng, p.lat)),
    );
    // 清除所有标记点并重新绘制（关键修改）
    clearMarkers();
    drawnPoints.value.forEach((p, idx) => {
      addPointMarker(p, idx);
    });

    ElMessage.info(`已添加 ${drawnPoints.value.length} 个航点`);
  };

  map.on("click", drawingClickHandler);
};
//设备新增
const startDrawingEquipment = () => {
  console.log("设备新增");
};
// 添加标记点（使用闭包保存正确的isEnd值）
const addPointMarker = (point, index, totalPoints) => {
  // 定义标记点样式配置
  const MARKER_STYLES = {
    START: {
      className: "start",
      color: "#67c23a",
      label: "S",
    },
    END: {
      className: "end",
      color: "#f56c6c",
      label: "E",
    },
    MIDDLE: {
      className: "middle",
      color: "#409EFF",
    },
  };
  // 动态判断是否为终点（使用let允许重新赋值）
  let isEnd = false;
  // 根据是否提供总点数来判断终点
  if (totalPoints !== undefined) {
    isEnd = index === totalPoints - 1;
  } else {
    isEnd = index === drawnPoints.value.length - 1;
  }
  // 确定当前点的样式
  const markerStyle =
    index === 0
      ? MARKER_STYLES.START
      : isEnd
        ? MARKER_STYLES.END
        : MARKER_STYLES.MIDDLE;

  // 动态生成标记文本
  const markerLabel =
    markerStyle === MARKER_STYLES.START
      ? "S"
      : markerStyle === MARKER_STYLES.END
        ? "E"
        : (index + 1).toString();

  // 创建标记点HTML
  const markerHtml = `<div class="marker ${markerStyle.className}">${markerLabel}</div>`;

  // 创建标记
  const marker = new AMap.Marker({
    position: new AMap.LngLat(point.lng, point.lat),
    content: markerHtml,
    offset: new AMap.Pixel(-20, -20),
  });

  // 确保样式只添加一次
  if (!document.getElementById("route-markers-style")) {
    const style = document.createElement("style");
    style.id = "route-markers-style";
    style.innerHTML = `
      .marker {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px
      }
      .start { background-color: #67c23a;}
      .end { background-color: #f56c6c; }
      .middle { background-color: #409EFF; }
    `;
    document.head.appendChild(style);
  }
  map.add(marker);
};

// 在调用addPointMarker的地方，传入当前数组长度
drawnPoints.value.forEach((point, index) => {
  addPointMarker(point, index, drawnPoints.value.length);
});
// 清除标记点
const clearMarkers = () => {
  if (!map) return;
  map.getAllOverlays("marker").forEach((overlay) => {
    if (overlay.isRouteMarker) {
      map.remove(overlay);
    }
  });
};
// 完成绘制
const finishDrawing = () => {
  if (!isDrawing.value || drawnPoints.value.length < 2) {
    ElMessage.warning("至少需要2个航点才能形成路线");
    return;
  }
  const coordinates = drawnPoints.value;
  const path = coordinates.map((point) => new AMap.LngLat(point.lng, point.lat));
  if (!map) return; // 确保地图已初始化
  // 清除之前的覆盖物（可选）
  clearOverlays();
  // 创建线对象
  const polyline = new AMap.Polyline({
    path: path,
    strokeColor: "#409eff", // 线颜色
    strokeWeight: 8, // 线宽
    strokeOpacity: 0.8, // 透明度
    lineStyle: "solid", // 线样式
  });
  // 添加到地图
  map.add(polyline);
  // 调整地图视野显示所有点
  map.setFitView();
  // 清除绘制状态
  isDrawing.value = false;
  map.off("click", drawingClickHandler);
  drawingClickHandler = null;
  //保存路线
  saveRoute();
};
// 完成绘制--无人机的行动轨迹
// const finishDrawing = () => {
//   // 检查绘制状态和点数量
//   if (!isDrawing.value || drawnPoints.value.length < 2) {
//     ElMessage.warning("至少需要2个航点才能形成路线");
//     return;
//   }

//   try {
//     // 清除绘制状态
//     isDrawing.value = false;
//     map.removeEventListener("click", drawingClickHandler);
//     drawingClickHandler = null;

//     // 停止并移除现有轨迹
//     if (carTrack) {
//       carTrack.stop();
//       map.removeOverLay(carTrack);
//     }

//     // 创建新的轨迹对象
//     carTrack = new T.CarTrack(map, {
//       Datas: drawnPoints.value.map((point) => new T.LngLat(point.lng, point.lat)),
//       interval: 50,
//       speed: 5,
//       polylinestyle: {
//         color: "#2C64A7",
//         weight: 4,
//         opacity: 0.8,
//         lineStyle: "solid",
//       },
//       carstyle: {
//         display: true,
//         iconUrl: droneIcon,
//         width: 20,
//         height: 20,
//         offset: new T.Point(24, 24),
//       },
//     });

//     console.log(carTrack, "carTrack 创建成功");

//     // 启动轨迹动画
//     carTrack.start();

//     // 显示成功消息
//     ElMessage.success("路线绘制完成，请保存");

//   } catch (error) {
//     console.error("完成绘制时发生错误:", error);
//     ElMessage.error("路线绘制失败，请重试");
//   }
// };
// 取消绘制
const cancelDrawing2 = () => {
  if (!isDrawing.value) return;
  // 清除绘制状态
  isDrawing.value = false;
  map.off("click", drawingClickHandler);
  drawingClickHandler = null;
  // 清除之前的覆盖物
  clearOverlays();
  drawnPoints.value = [];
  ElMessage.info("已取消绘制");
};

// 完成绘制
const saveRoute2 = () => {
  if (!newRouteName.value) {
    ElMessage.warning("请输入路线名称");
    return;
  }
  if (drawnPoints.value.length < 2) {
    ElMessage.warning("至少需要2个航点才能保存路线");
    return;
  }
  // 创建新路线
  const newRoute = {
    id: ++currentRouteId,
    name: newRouteName.value,
    points: drawnPoints.value,
  };

  // 添加到路线列表
  routes.value.push(newRoute);
  // 关闭对话框并清除状态
  saveDialogVisible.value = false;
  newRouteName.value = "";
  //清除所有覆盖物
  clearOverlays();
};
//保存路线
const saveRoute = async () => {
  if (!hasTrack.value) {
    ElMessage.warning("没有可保存的路线");
    return;
  }
  try {
    savingRoute.value = true;
    // 获取当前路线的点
    const routePoints =
      fixedTrackPoints.length > 0 ? fixedTrackPoints : drawnPoints.value;
    newRoutePoints.value = routePoints;
    // 获取当前位置作为home_pos
    let homePosition = null;
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        });
        homePosition = {
          lat: position.coords.latitude,
          log: position.coords.longitude,
          alt: 0,
        };
      } catch (error) {
        console.warn("获取当前位置失败:", error);
        // 如果获取当前位置失败，使用第一个点作为home_pos
        homePosition = {
          lat: routePoints[0].lat,
          log: routePoints[0].lng,
          alt: 0,
        };
      }
    }
    saveRouteDialogVisible.value = true;
    isDrawing.value = false;
  } catch (error) {
    savingRoute.value = false;
    isDrawing.value = false;
  }
};
//保存路线的时候对参数进行转换
function convertPoints(points) {
  // 1. 转换 points 数组（lng → lon）
  const convertedPoints = points.map((point) => ({
    lat: point.lat,
    lon: point.lng, // 重命名 lng 为 lon
    alt: point.alt,
  }));
  // 2. 设置 home_pos（使用第一个点）
  const homePos =
    points.length > 0
      ? {
        lat: points[0].lat,
        lon: points[0].lng,
        alt: 0, // home_pos 的 alt 固定为 0
      }
      : { lat: 0, lon: 0, alt: 0 };
  // 3. 构建完整对象并序列化为 JSON 字符串
  const result = {
    routeData: {
      type: "mission",
      points: convertedPoints,
      home_pos: homePos,
    },
  };
  return JSON.stringify(result);
}
// 确认保存路线
const confirmSaveRoute = async () => {
  saveRouteFormRef.value.validate(async (valid) => {
    console.log(valid);
    if (valid) {
      try {
        const routeData = {
          type: "mission",
          // 添加路线名称
          points: newRoutePoints.value.map((point) => ({
            lat: point.lat,
            lng: point.lng,
            alt: 30, // 默认高度30米，可以根据需要修改
          })),
        };
        ((newArr.value = {
          name: saveRouteForm.value.name,
          description: saveRouteForm.value.description,
          points: routeData.points,
        }),
          console.log(newArr.value));
        const pointsJson = convertPoints(newArr.value.points);
        let params = {
          name: newArr.value.name,
          description: newArr.value.description,
          points: pointsJson,
        };
        let res = await addRoute(params);
        if (res.code === 200) {
          saveRouteDialogVisible.value = false;
          ElMessage.success("路线存成功");
          //航线列表
          await routeList();
        }
      } catch (error) {
        console.error("表单验证失败", error);
      }
    }
  });
};
// 查看路线
const viewRoute = (route) => {
  if (!map) return;
  // 清除现有覆盖物
  clearOverlays();
  // 显示查看状态
  isViewing.value = false;
  // 绘制路线
  const path = route.points.map((p) => new AMap.LngLat(p.lng, p.lat));
  const polyline = new AMap.Polyline({
    path: path,
    strokeColor: "#2c64a7",
    strokeWeight: 8,
    strokeOpacity: 0.8,
    lineStyle: "solid",
  });
  map.add(polyline);
  // 添加标记点
  route.points.forEach((point, index) => {
    addPointMarker(point, index, route.points.length);
  });
  // 调整地图视图
  map.setFitView();
  ElMessage.info(`已显示路线: ${route.name}`);
};
// //编辑路线
// const routeEdit = (route) => {
//     console.log(route);

// };
// const viewRoute = (route) => {
//   if (!map) {
//     ElMessage.error("地图未初始化，无法查看路线");
//     return;
//   }

//   try {
//     // 清除现有覆盖物
//     clearOverlays();

//     // 显示查看状态
//     isViewing.value = false;

//     // 确保路线有点数据
//     if (route.points.length < 2) {
//       ElMessage.warning("路线点数量不足，无法显示");
//       return;
//     }

//     // 绘制路线
//     const path = route.points.map(p => new T.LngLat(p.lng, p.lat));
//     const polyline = new T.Polyline(path, {
//       color: "#2c64a7",
//       weight: 8,
//       opacity: 0.8,
//       lineStyle: "solid"
//     });
//     map.addOverLay(polyline);

//     // 添加标记点
//     route.points.forEach((point, index) => {
//       addPointMarker(point, index);
//     });

//     // 调整地图视图
//     // 计算路线的边界框
//     let minLng = Infinity, minLat = Infinity;
//     let maxLng = -Infinity, maxLat = -Infinity;

//     path.forEach(lnglat => {
//       minLng = Math.min(minLng, lnglat.lng);
//       minLat = Math.min(minLat, lnglat.lat);
//       maxLng = Math.max(maxLng, lnglat.lng);
//       maxLat = Math.max(maxLat, lnglat.lat);
//     });

//     // 创建中心点
//     const center = new T.LngLat(
//       (minLng + maxLng) / 2,
//       (minLat + maxLat) / 2
//     );

//     // 设置缩放级别限制
//     const minZoom = 10;  // 最小缩放级别
//     const maxZoom = 18;  // 最大缩放级别

//     // 计算边界框对角线距离（单位：米）
//     const ne = new T.LngLat(maxLng, maxLat);
//     const sw = new T.LngLat(minLng, minLat);
//     const diagonalDistance = ne.distanceTo(sw);

//     // 优化的缩放级别估算公式
//     // 对于短路线使用更大的缩放级别，对于长路线使用更小的缩放级别
//     let estimatedZoom;

//     if (diagonalDistance <= 100) {  // 极短路线（<100米）
//       estimatedZoom = maxZoom;  // 使用最大缩放级别
//     } else if (diagonalDistance <= 1000) {  // 短路线（<1公里）
//       // 动态计算缩放级别，在15-18之间
//       estimatedZoom = Math.min(maxZoom, 15 + (1000 - diagonalDistance) / 1000 * 3);
//     } else {  // 长路线
//       // 原有的缩放计算逻辑
//       estimatedZoom = Math.max(minZoom, 15 - Math.log(diagonalDistance / 1000) / Math.LN2);
//     }

//     // 使用天地图API的正确方法
//     // 移动地图中心点并设置缩放级别
//     map.panTo(center);
//     map.setZoom(estimatedZoom);

//     // 强制刷新地图
//     map.checkResize();

//     ElMessage.success(`已定位并显示路线: ${route.name}`);

//   } catch (error) {
//     console.error("查看路线时发生错误:", error);
//     ElMessage.error("查看路线失败，请重试");
//   }
// };

//编辑航线
const editAirline = (value, index) => {
  console.log(value, index, "editAirline");
  formData.value.waypointNumber = index;
  formData.value.routeLongitude = value.lng;
  formData.value.routeLatitude = value.lat;
  waypointSettingVisible.value = true;
};
// 删除路线
const deleteRoute = (index) => {
  deletingRouteIndex.value = index;
  deleteDialogVisible.value = true;
};

// 确认删除路线
const confirmDelete = async () => {
  const index = deletingRouteIndex.value;
  try {
    let res = await deleteManageRoute(index.id);
    console.log(res);
    if (res.code === 200) {
      deleteDialogVisible.value = false;
      ElMessage.success("删除成功");
      await routeList();
    }
  } catch (error) {
    ElMessage.error("删除失败，请重试");
    console.error("删除接口报错：", error);
  }
};

// 清除所有覆盖物
const clearOverlays = () => {
  if (map) {
    map.clearMap();
    if (drawingLine) {
      map.remove(drawingLine);
      drawingLine = null;
    }
    if (carTrack) {
      carTrack.stop();
      map.remove(carTrack);
      carTrack = null;
    }
  }
};
// 航线编辑
const editWaypoint = () => {
  console.log(formData.value);
};
// 修改地图点击处理函数
const handleMapClick = (e) => {
  if (!isDrawing.value) return;

  // 获取点击的坐标（高德地图直接返回GCJ-02坐标）
  const originalLng = e.lnglat.lng;
  const originalLat = e.lnglat.lat;

  // 存储坐标
  const point = {
    lng: originalLng,
    lat: originalLat,
    isManual: true, // 标记为手动点击的点
  };

  // 添加新点并更新绘制线
  drawnPoints.value.push(point);
  if (drawingLine) {
    drawingLine.setPath(
      drawnPoints.value.map((p) => new AMap.LngLat(p.lng, p.lat)),
    );
  }

  // 添加标记点
  const marker = new AMap.Marker({
    position: new AMap.LngLat(point.lng, point.lat),
    icon: new AMap.Icon({
      size: new AMap.Size(12, 12),
      image: droneIcon,
      imageSize: new AMap.Size(12, 12),
    }),
    offset: new AMap.Pixel(-6, -6),
  });
  marker.isRouteMarker = true; // 标记为路线标记，方便后续清除
  map.add(marker);
};
// 修改子组件中监听isCollapse变化的部分
watch(
  isCollapse,
  (newVal) => {
    console.log("isCollapse变化了:", newVal);

    // 当折叠状态变化时，触发地图尺寸重计算
    if (map && typeof map.resize === "function") {
      // 延迟一小段时间，确保DOM已经更新完成
      setTimeout(() => {
        map.resize(); // 高德地图API提供的重绘方法

        // 如果有必要，可以同时调整地图视野
        if (currentPosition.value) {
          map.panTo([currentPosition.value.lng, currentPosition.value.lat]);
        }
      }, 300);
    }
  },
  { immediate: true },
);
watch(waypointSettingVisible, (newVale) => {
  if (newVale === false) {
    formData.value = {
      waypointNumber: "", //航点序号
      whetherDisplay: "1", //是否使展示航线参数
      routeLongitude: "", //航线经度
      routeLatitude: "", //航线纬度
      residenceTime: "", //停留时间
      turningRadius: "", //航向角
      headingAngle: "", //航线纬度
      flightAltitude: "", //航点飞行高度
    };
  }
});

// 监听导航变化，更新上次非监控页记录
watch(activeNav, (newVal, oldVal) => {
  // 当从非监控页切换到监控页时，记录当前导航
  if (newVal === "monitor" && oldVal !== "monitor") {
    lastNonMonitorNav.value = oldVal;
  }
  // 当从监控页切换到其他页时，更新记录为当前页
  if (newVal !== "monitor") {
    lastNonMonitorNav.value = newVal;
  }
});
const infoOverview = () => {
  try {
    let res = statisticCount();
    console.log(res, "======");
    if (res === 200) {

    }
  } catch (err) { }
};
onMounted(() => {
  //天地图
  initMap();
  //航线列表
  // routeList();
  infoOverview();
  // 找到当前页面的.page-content元素（确保只作用于当前页面的容器）
  const pageContent = document.querySelector(".page-content");
  console.log(pageContent, "pageContent");

  if (pageContent) {
    // 添加自定义类名（无padding）
    pageContent.classList.add("current-page-no-padding");
  }
  //header 背景图片等比列缩放
  const img = new Image();
  img.src = headerBg; // 图片路径
  img.onload = () => {
    // 计算高宽比（高度/宽度 × 100%）
    headerRatio.value = (img.height / img.width) * 100;
  };
});

// 卸载
onBeforeUnmount(() => {
  //清除padding避免影响其他页面
  const pageContent = document.querySelector(".page-content");
  if (pageContent) {
    pageContent.classList.remove("current-page-no-padding");
  }
  try {
    // 停止并清除轨迹对象
    if (carTrack) {
      carTrack.stop();
      map.remove(carTrack);
      carTrack = null;
    }

    // 清除绘制线
    if (drawingLine) {
      map.remove(drawingLine);
      drawingLine = null;
    }

    // 清除所有覆盖物
    if (map) {
      map.clearMap();
    }

    // 移除事件监听
    if (map) {
      map.off("click", handleMapClick);
    }

    // 销毁地图实例
    if (map) {
      map.destroy();
      map = null;
    }

    // 重置所有状态
    isDrawing.value = false;
    loading.value = false;
    drawnPoints.value = [];
    trackHistory.value = [];
  } catch (error) {
    console.error("清理资源失败:", error);
  }
  // 清理资源
  if (map) {
    if (drawingClickHandler) {
      map.off("click", drawingClickHandler);
    }
    map = null;
  }
  drawingLine = null;
  carTrack = null;
});
</script>

<style scoped>
:deep(.page-content) {
  padding: 0 !important;
  margin: 0 !important;
}

.demo-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  /* background-color: #f5f7fa; */
  overflow: hidden;
  position: relative;
}

.main-content {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.header {
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    position: relative;
    z-index: 1000;
    background-image: url(../../assets/header-bg.png);
    background-position: top center;
    background-repeat: repeat-x;
    align-items: flex-start;
    color: #fff;
    padding: 2rem 2.4rem 0 2rem;
    opacity: 0.8; */
  /* 核心：固定高度（根据需求调整，此处以 120px 为例） */
  height: 80px;
  /* 确保高度包含内边距，避免被 padding 撑开 */
  box-sizing: border-box;

  /* 背景图设置：在固定高度内完整显示，不裁剪 */
  background-image: url(../../assets/header-bg.png);
  background-position: center;
  /* 居中显示 */
  background-repeat: no-repeat;
  /* 不重复 */
  background-size: contain;
  /* 等比例缩放，完整显示图片 */

  /* 原有样式保留 */
  position: relative;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  color: #fff;
  opacity: 0.8;
  padding: 0 2.4rem;
  /* 仅保留左右内边距，上下内边距通过子元素定位控制 */
}

.nav {
  display: flex;
  /* gap: 48px; */
  margin-top: 3.5px;
}

/* 左侧导航样式 */
.nav-item-left {
  color: #cfe2ff;
  text-decoration: none;
  padding: 4px 0;
  position: relative;
  transform: skew(22deg);
  width: 106px;
  height: 20px;
  display: flex;
  justify-content: center;
  /* border: 2px solid #3498db; */
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGoAAAAcCAYAAACJWipLAAAAAXNSR0IArs4c6QAAAuNJREFUaEPtmkFIVFEYhc8d590xKShKK2hlFrkICkKjlkYQBNEiCFxYEDLvSpDQKoKSolWUEb43SJBCGdRKCCKoVRRKFlFBQTK2aFWLWqT57hvfH6OEZY7v3rmz/Gf7zn/+4Tvc4czlCdh88roNGYzbjLC2BgQIz4WVjdJ3kCSvUKi/bjXH4uoJ+HoCIukzD0rRJiB+j5npFgyt+1H9Zp40JtATd4DoBgJvp0VQ8QUQbUQolfEiFroRUPFjEI0glMNmQR0jiUY9BeAAgtwHt+08bUQgr3dD0Cjm5FYMitgsqHzUiYzoQiAPGi1hkTsBP7oH0EuE9dfKZmZBKT0GkbmMgexD92/ADqkE/F/NEHVjgNeMQPw0C6pcyQWNoEluR59IUpewwJ2A0gNI6DsKufN/zNJPFFdyd/A2DqepEaX4IyhqRWHNV7OguJLbIK6N1o8uAWL90na98olSXMlrQ9/QRdFqIC6CvL0IRfHvqcpBzVfy0hSQcCU35Owsy8/2IiPaEeSOL/WqHBRXcmfuVgbd5MGLJxHjKAbla/OguJJbcXYW+7oLAp2V/qsuf6K6dTvq6C5Xcmf8hgYkoOK3oLlehKueLDe0fFDlSk6YQCj7DTexzIVAvnQYmeQiArmnks3/QXVPb0bWe8e35C7kLWeVfoaEbqKQu28eVLmSg5oQyB7LdSyvhoCK9wE0jG/eDjwQc2ZBcSWvBrXbjB+NAuIRQllYyejfnz4VdQJ8S+5G3mJaRa1A5ilmss0YErMWQfEtuQVmd6nSt0H0CWHuSprZ4oniSp7GqrbPT81sgcy+gfRa0C9SX21YDIoreW2DSHNT+uq8JJBn06Tl5wtBcSU3YVU7zRlaCx1PQpd24VbDFxPjhaC4kpuwqp3Gj85BiG0I5ElTU4FyJd+gP0Ogg19cMcXmoDtB9WgoFYHEircAV3IH6lWM+joP0CGEuSM20wK+HodAm80Qa10JiP0IvBc2Lr8BdTAKAmbsbp0AAAAASUVORK5CYII=");
  /* background: transparent; */
  transform: rotateY(180deg);
  cursor: pointer;
  /* 新增：默认透明背景 */
}

/* 抵消父元素倾斜，让文字正过来 */
.nav-item-left span {
  transform: skew(-2deg);
  display: inline-block;
  /* 必须，否则transform不生效 */
}

/* 选中状态：蓝白渐变背景 */
.nav-item-left.active {
  color: #fff;
  font-weight: 600;
  border: none;
  /* background: linear-gradient(to bottom, #4b95f6 20%, #6caaf6 50%, #88bff6 80%); */
  width: 106px;
  height: 25px;
  background-image: url("data:image/png;base64,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");
  transform: rotateY(180deg);
}

/* .nav-item-left.active::after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #409eff;
} */

/* 右侧导航样式 - 修复关键 */
.nav-item {
  color: #cfe2ff;
  text-decoration: none;
  padding: 4px 0;
  position: relative;
  transform: skew(341deg);
  width: 106px;
  height: 20px;
  display: flex;
  justify-content: center;
  /* border: 2px solid #3498db; */
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGoAAAAcCAYAAACJWipLAAAAAXNSR0IArs4c6QAAAuNJREFUaEPtmkFIVFEYhc8d590xKShKK2hlFrkICkKjlkYQBNEiCFxYEDLvSpDQKoKSolWUEb43SJBCGdRKCCKoVRRKFlFBQTK2aFWLWqT57hvfH6OEZY7v3rmz/Gf7zn/+4Tvc4czlCdh88roNGYzbjLC2BgQIz4WVjdJ3kCSvUKi/bjXH4uoJ+HoCIukzD0rRJiB+j5npFgyt+1H9Zp40JtATd4DoBgJvp0VQ8QUQbUQolfEiFroRUPFjEI0glMNmQR0jiUY9BeAAgtwHt+08bUQgr3dD0Cjm5FYMitgsqHzUiYzoQiAPGi1hkTsBP7oH0EuE9dfKZmZBKT0GkbmMgexD92/ADqkE/F/NEHVjgNeMQPw0C6pcyQWNoEluR59IUpewwJ2A0gNI6DsKufN/zNJPFFdyd/A2DqepEaX4IyhqRWHNV7OguJLbIK6N1o8uAWL90na98olSXMlrQ9/QRdFqIC6CvL0IRfHvqcpBzVfy0hSQcCU35Owsy8/2IiPaEeSOL/WqHBRXcmfuVgbd5MGLJxHjKAbla/OguJJbcXYW+7oLAp2V/qsuf6K6dTvq6C5Xcmf8hgYkoOK3oLlehKueLDe0fFDlSk6YQCj7DTexzIVAvnQYmeQiArmnks3/QXVPb0bWe8e35C7kLWeVfoaEbqKQu28eVLmSg5oQyB7LdSyvhoCK9wE0jG/eDjwQc2ZBcSWvBrXbjB+NAuIRQllYyejfnz4VdQJ8S+5G3mJaRa1A5ilmss0YErMWQfEtuQVmd6nSt0H0CWHuSprZ4oniSp7GqrbPT81sgcy+gfRa0C9SX21YDIoreW2DSHNT+uq8JJBn06Tl5wtBcSU3YVU7zRlaCx1PQpd24VbDFxPjhaC4kpuwqp3Gj85BiG0I5ElTU4FyJd+gP0Ogg19cMcXmoDtB9WgoFYHEircAV3IH6lWM+joP0CGEuSM20wK+HodAm80Qa10JiP0IvBc2Lr8BdTAKAmbsbp0AAAAASUVORK5CYII=");
  /* background: transparent; */
  cursor: pointer;
}

/* 抵消父元素倾斜，让文字正过来 */
.nav-item span {
  transform: skew(20deg);
  display: inline-block;
  /* 必须，否则transform不生效 */
}

/* 只有带active类的才应用选中样式 */
.nav-item.active {
  color: #fff;
  font-weight: 600;
  border: none;
  width: 106px;
  height: 25px;
  background-image: url("data:image/png;base64,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");
  /* background: linear-gradient(to bottom, #4b95f6 20%, #6caaf6 50%, #88bff6 80%); */
}

/* .nav-item.active::after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #409eff;
} */

.header-title {
  text-align: center;
  /* width: 45%; */
}

.header-title h1 {
  font-size: 30px;
  /* 修正拼写错误：3s0px -> 30px */
  margin: 0;
}

.header-title p {
  font-size: 12px;
  color: #b3d3ff;
}

.largeScreenInfo {
  display: flex;
  width: 100%;
  justify-content: space-between;
  height: 100%;
}

.floating-panel {
  z-index: 1000;
  width: 21rem;
  max-height: calc(100vh - 104px);
  overflow-y: auto;
}

.control-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #fff;
  margin-bottom: 12px;
}

.control-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  padding: 20px 20px 0 20px;
  align-items: center;
}

.sidebar-header h2 {
  margin-left: 0.3rem;
  font-weight: 700;
  font-size: 20px;
  color: #fff;
  background: linear-gradient(270deg, #8dd5ff, #e0f0ff 41.40625%, #8dd5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.routeList {
  display: flex;
  justify-content: center;
  align-items: center;
}

.routeListAdd {
  color: #1677ff;
  font-size: 14px;
  cursor: pointer;
}

.search-bar {
  width: calc(100% - 40px);
  padding: 0 20px 10px 20px;
}

.routListTitle {
  display: flex;
  justify-content: space-between;
}

.routListCheck {
  color: #1677ff;
  cursor: pointer;
  margin-right: 12px;
}

.routListDelect {
  color: red;
  cursor: pointer;
}

.globalSettings {
  width: 100%;
  margin-top: 12px;
}

.infoOverview {
  width: 100%;
  margin-bottom: 12px;
}

.routEdit {
  color: #1677ff;
  cursor: pointer;
}

.routeListContent {
  display: flex;
  justify-content: space-between;
  background-color: #50505066;
  padding: 12px;
  margin-bottom: 8px;
}

.contentArea-left {
  margin-bottom: 12px;
  height: 100%;
  background: #00285a80;
  display: flex;
  flex-direction: column;
}

.header-container {
  display: flex;
  justify-content: center;
  width: 100%;
  position: relative;
  top: -22%;
}

.header h2 {
  margin: 0;
  color: #303133;
  font-weight: 600;
}

/* 左侧导航 */
.header-left {
  position: absolute;
  top: 26%;
  right: 64%;
  /* 垂直居中 */
  left: 2rem;
  transform: translateY(-50%);
  /* 抵消自身高度的一半，实现完美居中 */
}

/* 中间标题 */
.header-title {
  position: absolute;
  top: 30%;
  /* 垂直居中 */
  left: 50%;
  transform: translate(-50%, -50%);
  /* 水平+垂直居中 */
  text-align: center;
}

/* 右侧导航 */
.header-right {
  position: absolute;
  left: 64.5%;
  top: 26%;
  /* 垂直居中 */
  right: 2.4rem;
  transform: translateY(-50%);
  /* 抵消自身高度的一半，实现完美居中 */
}

/* .header-left .date {
    font-size: 14px;
    margin-bottom: 4px;
    color: #b3d3ff;
} */

/* .header-right .user {
    margin-left: 24px;
    color: #cfe2ff;
    cursor: pointer;
    align-self: center;
} */

.contentArea {
  width: 100%;
  height: calc(100% - 124px);
  display: flex;
  justify-content: space-between;
  position: relative;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.control-group {
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.control-group:last-child {
  border-bottom: none;
}

.group-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clear-button {
  width: 100%;
  margin-top: 8px;
}

.save-button {
  margin-top: 12px;
  width: 100%;
}

/* 滚动条样式 */
.floating-panel::-webkit-scrollbar {
  width: 6px;
}

.floating-panel::-webkit-scrollbar-track {
  background: transparent;
}

.floating-panel::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}

.floating-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(144, 147, 153, 0.5);
}

/* 右侧信息概览 */
.contentArea-right {
  color: #fff;
}

.info-card {
  padding: 16px;
  border-radius: 8px;
}

.info-card h3 {
  font-size: 16px;
  margin: 0 0 12px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-item {
  padding: 10px;
  border: 1px solid #1f538d;
  border-radius: 4px;
  text-align: center;
  background: #00103280;
}

.stat-item .value {
  display: block;
  font-size: 16px;
  color: rgb(152 169 209);
  margin-top: 4px;
}

.stat-item span {
  font-size: 14px;
}

:deep(.el-card) {
  border: none;
  background: #00285a80;
  border: 1px solid rgba(60, 127, 231, 0.24);
}

:deep(.el-button-group) {
  gap: 8px;
  display: flex;
  flex-wrap: wrap;
}

.el-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.el-form-item {
  margin-bottom: 16px;
}

.el-radio-group {
  display: flex;
  gap: 20px;
}

/* Element Plus 样式覆盖 */
:deep(.search-bar .el-input__wrapper) {
  background: #143459;
  border: 1px solid #1f538d;
  box-shadow: none;
}

:deep(.search-bar .el-input__placeholder) {
  color: #fff;
}

:deep(.search-bar.el-input__inner) {
  background: transparent;
}

:deep(.el-form-item__label) {
  justify-content: start;
}

:deep(.hangxianliebiao .el-input__inner) {
  color: #fff;
}

:deep(.tdt-div-icon) {
  border: none;
  background: none;
}

:deep(.el-card__header) {
  border-bottom: none;
  padding-bottom: 0;
}

/* 适配移动设备 */
@media screen and (max-width: 768px) {
  .floating-panel {
    max-width: calc(100% - 40px);
  }
}

/* @media (max-width: 1200px) {
    .header {
        height: 58px;
    }

    .header-title h1 {
        font-size: 17px;
    }

    .header-title p {
        font-size: 10px;

    }
} */
</style>
