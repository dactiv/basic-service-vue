<template>

  <a-breadcrumb class="hidden-xs">
    <a-breadcrumb-item><router-link to='/'><icon-font class="icon" type="icon-home" /> 首页</router-link></a-breadcrumb-item>
    <a-breadcrumb-item><icon-font class="icon" type="icon-message" /> 消息管理</a-breadcrumb-item>
    <a-breadcrumb-item><router-link :to="{name:'message_email'}"><icon-font class="icon" type="icon-email" /> 邮件消息</router-link></a-breadcrumb-item>
    <a-breadcrumb-item><icon-font class="icon" type="icon-file" /> 邮件消息明细</a-breadcrumb-item>
  </a-breadcrumb>

  <a-card title="邮件明细" class="basic-box-shadow">
    <template #extra>
      <a-button @click="reload" :loading="spinning">
        <icon-font class="icon" v-if="!spinning" type="icon-refresh" />
        <span class="hidden-xs">刷新</span>
      </a-button>
    </template>

    <a-spin :spinning="spinning">
      <a-descriptions
          bordered
          :column="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 2, xs: 1 }"
      >

        <a-descriptions-item label="类型">{{ form.type.name }}</a-descriptions-item>
        <a-descriptions-item label="状态"><a-badge :status="form.executeStatus.value === 0 ? 'processing' : form.executeStatus.value === 1 ? 'success' : 'error'" :text="form.executeStatus.name" /></a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ timestampFormat(form.creationTime) }} </a-descriptions-item>
        <a-descriptions-item label="下次重试时间">{{ timestampFormat(form.nextRetryTime) }} </a-descriptions-item>
        <a-descriptions-item label="最后发送时间">{{ timestampFormat(form.lastSendTime) }} </a-descriptions-item>
        <a-descriptions-item label="发送完成时间">{{ timestampFormat(form.successTime) }} </a-descriptions-item>
        <a-descriptions-item label="重试次数">{{ form.retryCount}}</a-descriptions-item>
        <a-descriptions-item label="最大重试次数">{{ form.maxRetryCount}}</a-descriptions-item>
        <a-descriptions-item label="异常信息" :span="2"><pre>{{ form.exception }}</pre></a-descriptions-item>

      </a-descriptions>

      <a-divider><a-typography-text type="secondary">邮件数据</a-typography-text></a-divider>

      <a-descriptions bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 2, xs: 1 }">

        <a-descriptions-item label="发送的邮件">{{ form.fromEmail }}</a-descriptions-item>
        <a-descriptions-item label="收取的收件">{{ form.toEmail}}</a-descriptions-item>
        <a-descriptions-item label="标题" :span="2">{{ form.title}}</a-descriptions-item>
        <a-descriptions-item label="内容" :span="2"><p v-html="form.content"></p></a-descriptions-item>
        <a-descriptions-item v-if="form.hasAttachment.value > 0" label="附件" :span="2">

          <a-list class="attachment" item-layout="horizontal" bordered  :data-source="form.attachmentList">
            <template #renderItem="{ item }">
              <a-list-item :key="item.id">
                <a-list-item-meta>
                  <template #title>
                    <a-typography-link href="javascript:;" @click="download(item.meta.link, item.contentType, item.name)">
                      {{ item.name }}
                    </a-typography-link>
                  </template>
                  <template #avatar>
                    <a-typography-link href="javascript:;" @click="download(item.meta.link, item.contentType, item.name)">
                      <icon-font class="icon" :type="getFileIcon(item.name)" />
                    </a-typography-link>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>

        </a-descriptions-item>
      </a-descriptions>

    </a-spin>
  </a-card>

</template>

<script>

export default {
  name:"MessageEmailDetail",
  methods:{
    download(url, type, name) {
      let _this = this;
      _this
          .$http
          .get(url,{responseType:'blob'})
          .then((res) => {
            let blob = new Blob([res.data], {type});

            let downloadElement = document.createElement('a')
            let href = window.URL.createObjectURL(blob); //创建下载的链接

            downloadElement.href = href;
            downloadElement.download = name; //下载后文件名

            document.body.appendChild(downloadElement);
            downloadElement.click(); //点击下载

            document.body.removeChild(downloadElement); //下载完成移除元素
            window.URL.revokeObjectURL(href); //释放blob对象
          });
    },
    reload() {

      let _this = this;

      _this.spinning = true;

      _this
          .$http
          .get("/message/email/get?id=" + this.$route.query.id)
          .then(r => {
            _this.form = r.data.data;
            _this.spinning = false
          })
          .catch(() => _this.spinning = false);

    }
  },
  computed: {
    tableScrollX() {

      if (this.columns.length > 0) {
        return this.columns.filter(c => c.width).reduce((sum, c) =>sum + c.width, 0);
      }

      return 0;
    }
  },
  data() {
    return {
      spinning:true,
      form: {
        id:"",
        creationTime: "",
        type: {
          name:"",
          value:""
        },
        executeStatus:{
          name:"",
          value:""
        },
        lastSendTime: "",
        successTime:"",
        nextRetryTime:"",
        fromEmail: "",
        toEmail: "",
        retryCount:"",
        maxRetryCount:"",
        hasAttachment: 0,
        attachmentList:[],
        exception:""
      }
    }
  },
  created() {
    this.reload();
  }
}
</script>