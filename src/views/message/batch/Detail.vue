<template>

  <a-breadcrumb class="hidden-xs">
    <a-breadcrumb-item><router-link to='/'><icon-font class="icon" type="icon-home" /> 首页</router-link></a-breadcrumb-item>
    <a-breadcrumb-item><icon-font class="icon" type="icon-message" /> 消息管理</a-breadcrumb-item>
    <a-breadcrumb-item><router-link :to="{name:'message_batch'}"><icon-font class="icon" type="icon-batch" /> 批量消息</router-link></a-breadcrumb-item>
    <a-breadcrumb-item><icon-font class="icon" type="icon-file" /> 批量消息明细</a-breadcrumb-item>
  </a-breadcrumb>

  <a-card title="批量消息明细" class="basic-box-shadow">
    <template #extra>
      <a-button @click="reload(page.number)" :loading="spinning">
        <icon-font class="icon" v-if="!spinning" type="icon-refresh" />
        <span class="hidden-xs">刷新</span>
      </a-button>
    </template>

    <a-spin :spinning="spinning">
      <a-descriptions
          bordered
          :column="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 2, xs: 1 }"
      >

        <a-descriptions-item label="类型"><icon-font class="icon" :type="form.type.value === 10 ? 'icon-notification' : form.type.value === 20 ? 'icon-email' : 'icon-sms'" /> {{ form.type.name }}</a-descriptions-item>
        <a-descriptions-item label="状态"><a-badge :status="form.executeStatus.value === 0 ? 'processing' : form.executeStatus.value === 1 ? 'success' : 'error'" :text="form.executeStatus.name" /></a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ timestampFormat(form.creationTime) }} </a-descriptions-item>
        <a-descriptions-item label="完成时间">{{ timestampFormat(form.completeTime) }}</a-descriptions-item>
        <a-descriptions-item label="总发送数量">{{ form.count}}</a-descriptions-item>
        <a-descriptions-item label="发送中数量">{{ form.sendingNumber}}</a-descriptions-item>
        <a-descriptions-item label="发送成功数量"><a-typography-text type="success">{{ form.successNumber }}</a-typography-text></a-descriptions-item>
        <a-descriptions-item label="发送失败数量"><a-typography-text type="danger">{{ form.failNumber }}</a-typography-text></a-descriptions-item>

      </a-descriptions>

      <a-divider><a-typography-text type="secondary"><icon-font class="icon" :type="form.type === 10 ? 'icon-notification' : form.type === 20 ? 'icon-email' : 'icon-sms'" /> {{ form.type.name }}数据</a-typography-text></a-divider>

      <a-table class="ant-table-striped" :rowKey="record=>record.id" :scroll="{ x: tableScrollX }" :pagination="false" :data-source="page.elements" :columns="columns" bordered>

        <template #lastSendTime="{ text:lastSendTime }">
          <span :title="timestampFormat(lastSendTime)">{{ timestampFormat(lastSendTime) }}</span>
        </template>

        <template #successTime="{ text:successTime }">
          <span :title="timestampFormat(successTime)">{{ timestampFormat(successTime) }}</span>
        </template>

      </a-table>

      <div class="margin-md-top text-right" >

        <a-space :size="10">
          <span class="hidden-xs">每页</span>
          <a-input v-model:value="page.size" size="small" @pressEnter="search" :maxlength="4" class="text-center hidden-xs" style="width: 50px" />
          <span class="hidden-xs">条 / 第 1 页</span>
          <a-button size="small" @click="search(page.number - 1)" :disabled="page.first"><icon-font type="icon-arrow-left-bold" /></a-button>
          {{page.number}}
          <a-button size="small" @click="search(page.number + 1)" :disabled="page.last"><icon-font type="icon-arrow-right-bold" /></a-button>

        </a-space>

      </div>

    </a-spin>
  </a-card>

</template>

<script>

export default {
  name:"MessageBatchDetail",
  methods:{
    search(number) {
      let _this = this;

      if (_this.form.type === 10) {
        _this.loadSiteData(number);
      } else if (_this.form.type === 20) {
        _this.loadEmailData(number);
      } else if (_this.form.type === 30) {
        _this.loadSmsData(number);
      }

    },
    reload(){

      let _this = this;

      if (!_this.$route.query.id) {
        return
      }

      _this
          .$http
          .get("/message/batch/get?id=" + _this.$route.query.id)
          .then(r => {
            _this.form = r.data.data;
            if (_this.form.type === 10) {
              _this.loadSiteData();
            } else if (_this.form.type === 20) {
              _this.loadEmailData();
            } else if (_this.form.type === 30) {
              _this.loadSmsData();
            }
            _this.spinning = false
          })
          .catch(() => _this.spinning = false);
    },
    loadBatchData() {
      let _this = this;

      if (!_this.$route.query.id) {
        return
      }

      _this
          .$http
          .get("/message/batch/get?id=" + _this.$route.query.id)
          .then(r => {
            _this.form = r.data.data;
            _this.reload();
            _this.spinning = false
          })
          .catch(() => _this.spinning = false);
    },
    loadSmsData(number) {
      let _this = this;

      let param = {"filter_[batch_id_eq]":this.form.id};

      param.size = _this.page.size || 10;
      param.number = number || _this.page.number;

      _this
          .$http
          .post("/message/sms/page",_this.formUrlencoded(param))
          .then(r => {
            _this.page = r.data.data;
            _this.columns = _this.smsColumns;
          });
    },
    loadSiteData(number) {
      let _this = this;

      let param = {"filter_[batch_id_eq]":this.form.id};

      param.size = _this.page.size || 10;
      param.number = number || _this.page.number;

      _this
          .$http
          .post("/message/site/page",_this.formUrlencoded(param))
          .then(r => {
            _this.page = r.data.data;
            _this.columns = _this.siteColumns;
          });
    },
    loadEmailData(number) {
      let _this = this;

      let param = {"filter_[batch_id_eq]":this.form.id};

      param.size = _this.page.size || 10;
      param.number = number || _this.page.number;

      _this
          .$http
          .post("/message/email/page",_this.formUrlencoded(param))
          .then(r => {
            _this.page = r.data.data;
            _this.columns = _this.emailColumns;
          });
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
      page:{
        elements:[],
        first:false,
        last:false,
        number:1
      },
      columns:[{
        title: "临时表格",
        ellipsis: true,
        width: 80
      }],
      smsColumns:[
        {
          title: "状态",
          dataIndex: "executeStatus.name",
          ellipsis: true,
          width: 100
        },
        {
          title: "类型",
          dataIndex: "type.name",
          ellipsis: true,
          width: 100
        },
        {
          title: "发送渠道",
          dataIndex: "channel",
          ellipsis: true,
          width: 200
        },
        {
          title: "收信电话",
          dataIndex: "phoneNumber",
          ellipsis: true,
          width: 200
        },{
          title: "内容",
          dataIndex: "content",
          ellipsis: true,
          width: 250
        },{
          title: "重试次数",
          dataIndex: "retryCount",
          ellipsis: true,
          width: 150
        },{
          title: "最后发送时间",
          dataIndex: "lastSendTime",
          ellipsis: true,
          width: 200,
          slots: { customRender: "lastSendTime" }
        },{
          title: "发送成功时间",
          dataIndex: "successTime",
          ellipsis: true,
          width: 200,
          slots: { customRender: "successTime" }
        }
      ],
      siteColumns:[
        {
          title: "状态",
          dataIndex: "executeStatus.name",
          ellipsis: true,
          width: 100
        },
        {
          title: "类型",
          dataIndex: "type.name",
          ellipsis: true,
          width: 100
        },
        {
          title: "发送渠道",
          dataIndex: "channel",
          ellipsis: true,
          width: 200
        },
        {
          title: "收信用户 id",
          dataIndex: "toUserId",
          ellipsis: true,
          width: 200
        },{
          title: "标题",
          dataIndex: "title",
          ellipsis: true,
          width: 250
        },{
          title: "重试次数",
          dataIndex: "retryCount",
          ellipsis: true,
          width: 150
        },{
          title: "最后发送时间",
          dataIndex: "lastSendTime",
          ellipsis: true,
          width: 200,
          slots: { customRender: "lastSendTime" }
        },{
          title: "发送成功时间",
          dataIndex: "successTime",
          ellipsis: true,
          width: 200,
          slots: { customRender: "successTime" }
        }
      ],
      emailColumns:[
        {
          title: "状态",
          dataIndex: "executeStatus.name",
          ellipsis: true,
          width: 100
        },
        {
          title: "类型",
          dataIndex: "type.name",
          ellipsis: true,
          width: 100
        },
        {
          title: "发送邮件",
          dataIndex: "fromEmail",
          ellipsis: true,
          width: 200
        },
        {
          title: "收取邮件",
          dataIndex: "toEmail",
          ellipsis: true,
          width: 200
        },{
          title: "标题",
          dataIndex: "title",
          ellipsis: true,
          width: 300
        },{
          title: "重试次数",
          dataIndex: "retryCount",
          ellipsis: true,
          width: 150
        },{
          title: "最后发送时间",
          dataIndex: "lastSendTime",
          ellipsis: true,
          width: 200,
          slots: { customRender: "lastSendTime" }
        },{
          title: "发送成功时间",
          dataIndex: "successTime",
          ellipsis: true,
          width: 200,
          slots: { customRender: "successTime" }
        }
      ],
      spinning:true,
      form: {
        id:"",
        creationTime: "",
        type:"",
        executeStatus:"",
        successNumber: "",
        failNumber:"",
        sendingNumber: "",
        completeTime: ""
      }
    }
  },
  created() {
    this.reload();
  }
}
</script>