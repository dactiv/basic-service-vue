<template>

  <a-spin :spinning="spinning">

    <a-table class="ant-table-striped" :row-selection="selection ? { selectedRowKeys: selectedIds, onSelect: select, onChange:selectChange} : undefined" :rowKey="record=>record.id" :scroll="{ x: 880 }" :pagination="false" :data-source="data" :columns="columns" bordered>

      <template #name="{ record }">
        <a-button type="text">
          <icon-font class="icon" :type="!record.icon ? 'icon-unkown' : record.icon" />
          <span>{{record.name}} </span>
        </a-button>
      </template>

      <template #sources="{ text: sources }">
        <a-space>
          <a-tag v-for="name of sources" :key="name.value" color="success">
            {{ name.value }}
          </a-tag>
        </a-space>
      </template>

      <template #action="{ record }">
        <div class="text-center">
          <a-space :size="10">
            <a-button size="small" @click="detail(record)" v-if="principal.hasPermission('perms[resource:get]')">
              <icon-font class="icon" type="icon-file"/>
              <span class="hidden-xs">详情</span>
            </a-button>
          </a-space>
        </div>
      </template>

    </a-table>

  </a-spin>

</template>

<script>
export default {
  name:"AuthenticationResourceTable",
  props:["selection", "searchData"],
  emits: ['searching', 'search'],
  data() {
    return {
      columns:[
        {
          title: "名称",
          dataIndex: "name",
          ellipsis: true,
          width: 300,
          slots: { customRender: 'name' },
        },{
          title: "来源",
          dataIndex: "sources",
          ellipsis: true,
          slots: { customRender: 'sources' },
          width: 120
        },{
          title: "資源值",
          dataIndex: "value",
          ellipsis: true,
          width: 180
        },{
          title: "权限值",
          dataIndex: "authority",
          ellipsis: true,
          width: 200
        },{
          title: "操作",
          dataIndex: "action",
          fixed: "right",
          width: 80,
          slots: { customRender: 'action' }
        }
      ],
      selectedIds:[],
      data: [],
      spinning:false
    }
  },
  methods:{
    select(record, selected) {
      if (selected) {
        let parentIds = this.getParentIds(record);
        parentIds.forEach(p => this.selectedIds.push(p));
        this.selectedIds.push(record.id);
        let childrenIds = this.getChildrenIds(record);
        childrenIds.forEach(c => this.selectedIds.push(c));
      } else {
        this.selectedIds.splice(this.selectedIds.indexOf(record.id), 1)
        let childrenIds = this.getChildrenIds(record);
        childrenIds.forEach(c => this.selectedIds.splice(this.selectedIds.findIndex(i => i === c), 1));
      }
    },
    selectChange(selectedIds) {
      this.selectedIds = selectedIds;
    },
    getSelectedRecords() {
      return this.selectedIds.map(id => this.getRecordById(id, this.data));
    },
    getRecordById(id, data) {
      for (let i = 0; i < data.length; i++) {
        let r = data[i];
        if (r.id === id) {
          return r;
        } else if (r.children) {
          r = this.getRecordById(id, r.children);
          if (r) {
            return r;
          }
        }
      }
    },
    getParentIds(record) {
      let result = [];
      if (!record.parentId) {
        return result
      }

      let parent = this.getRecordById(record.parentId, this.data);
      if (parent) {
        let parentIds = this.getParentIds(parent);
        parentIds.forEach(p => result.push(p));
      }

      result.push(record.parentId);

      return result;
    },
    getChildrenIds(record) {

      let result = [];
      if (record.children) {
        for (let i = 0; i < record.children.length; i++) {
          let c = record.children[i];
          result.push(c.id);

          let ids = this.getChildrenIds(c);
          ids.forEach(id => result.push(id));
        }
      }

      return result;

    },
    detail(record) {

      let to = {
        name: "authentication_resource_detail"
      }

      if (record !== undefined) {
        to["query"] = {id:record.id};
      }

      this.$router.push(to);

    },
    search(form) {
      let _this = this;

      _this.spinning = true;
      _this.$emit('searching');

      if (!form) {
        form = this.searchData;
      }

      _this
          .$http
          .post("/authentication/resource/find",_this.formUrlencoded(form))
          .then(r => {
            _this.data = r.data.data;
            _this.spinning = false;
            _this.$emit('search');
          })
          .catch(() => _this.spinning = false);
    }
  }
}

</script>