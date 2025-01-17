<template>
  <a-row class="height-100-percent">
    <a-col :span="5" class="tool-bar border-right">
      <div class="text-center margin-md-top">
        <a-avatar :src="principal.details.avatar" />
        <a-menu mode="vertical" class="margin-top" @select="toolbarSelect" :selectedKeys="selectedToolBar">
          <a-menu-item key="message">
            <a-badge :count="unreadMessageCount" :offset="[x=-20, y=0]">
              <icon-font class="icon" type="icon-message" />
            </a-badge>
          </a-menu-item>
          <a-menu-item key="group">
            <icon-font class="icon" type="icon-group" />
          </a-menu-item>
        </a-menu>
      </div>
    </a-col>
    <a-col :span="19" class="height-100-percent">
      <div class="search">
        <a-input placeholder="搜索" v-model:value="searchText" />
      </div>
      <div class="left-content">
        <a-menu v-show="tab === 'message'" @click="selectContact" :selectedKeys="selectedKeys" mode="vertical">
          <a-menu-item v-for="c of contactData" :key="c.type + '-' + c.id" >
            <a-dropdown :trigger="['contextmenu']">
              <a-row type="flex" justify="space-around" align="middle">
                <a-col :span="4">
                  <a-badge :count="c.messages.reduce((s, m) => s + m.contents.filter(ct => ct.status === 'unread').length, 0)" :offset="[x = -25, y = 0]">
                    <a-avatar :src="c.type === 10 ? this.getPrincipalAvatarByUserId(c.id) : null" :shape="c.type === 10 ? 'circle' : 'square'" />
                  </a-badge>
                </a-col>
                <a-col :span="20" class="padding-left">
                  <a-row>
                    <a-col :span="16">
                      <a-typography-text strong :ellipsis="true" class="contacts-name display-block" >
                        <icon-font v-if="c.top" class="icon" type="icon-star" />
                        <icon-font v-else-if="c.disturb" class="icon" type="icon-stop" />
                        {{c.name}}
                      </a-typography-text>
                    </a-col>
                    <a-col :span="8" class="text-right">
                      <a-typography-text v-if="c.lastSendTime" type="secondary" class="contacts-name display-block font-size-sm" :content="$moment(c.lastSendTime).fromNow()" />
                    </a-col>
                  </a-row>
                  <a-row type="flex" justify="space-around" align="middle">
                    <a-col :span="24">
                      <a-typography-text :ellipsis="true" type="secondary" class="contacts-message display-block" :content="c.lastMessage" />
                    </a-col>
                  </a-row>
                </a-col>
              </a-row>
              <template #overlay>
                <a-menu @click="contactContextMenuClick">
                  <a-menu-item :key="c.id + '-' + c.type + '-top'"><icon-font class="icon" :type="c.top ? 'icon-unstar' : 'icon-star'" /> {{c.top ? '取消置顶' : '置顶'}}</a-menu-item>
                  <a-menu-item v-if="!c.top" :key="c.id + '-' + c.type + '-disturb'">
                    <icon-font class="icon" :type="c.disturb ? 'icon-success' : 'icon-stop'" /> {{c.disturb ? '取消免打扰' : '消息免打扰'}}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item :key="c.id + '-' + c.type + '-delete'"><icon-font class="icon" type="icon-error" /> 删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-menu-item>
        </a-menu>
        <div v-show="tab === 'group'">
          <a-tree @select="selectTreeContact" show-icon :load-data="loadTreeData" :replaceFields="{title:'name', key:'id'}" :tree-data="tree.data">
            <template #group>
              <icon-font class="icon" type="icon-folder-close" />
            </template>
            <template #room>
              <icon-font class="icon" type="icon-user-groups" />
            </template>
            <template #contact>
              <icon-font class="icon" type="icon-profile" />
            </template>
            <template #title="{name, id}">
              <div v-if="id.includes('user-') || id.includes('room-')" class="group-user">
                <a-avatar size="small" :src="id.includes('user-') ? getPrincipalAvatarByUserId(id.replace('user-','')) : ''" :shape="id.includes('user-') ? 'circle' : 'square'" />
                <a-typography-text strong :content="name" />
              </div>
              <a-typography-text v-else :content="name" />
            </template>
          </a-tree>
        </div>
      </div>
    </a-col>
  </a-row>
</template>

<script>

import {SOCKET_EVENT_TYPE, SOCKET_IO_ACTION_TYPE} from "@/store/socketIo";

export default {
  name:"ChatContact",
  emits: ["selectMessageContact", "selectTreeContact", "contactContextMenuClick"],
  props: ["contactData", "unreadMessageCount"],
  created() {
    this.$store.dispatch(SOCKET_IO_ACTION_TYPE.SUBSCRIBE,{
      name:SOCKET_EVENT_TYPE.ROOM_CREATE,
      callback:this.onRoomCreate
    });

    this.$store.dispatch(SOCKET_IO_ACTION_TYPE.SUBSCRIBE,{
      name:SOCKET_EVENT_TYPE.ROOM_DELETE,
      callback:this.onRoomDelete
    });

    this.$store.dispatch(SOCKET_IO_ACTION_TYPE.SUBSCRIBE,{
      name:SOCKET_EVENT_TYPE.ROOM_RENAME,
      callback:this.onRoomRename
    });
  },
  data() {
    return {
      searchText:"",
      selectedKeys:[],
      selectedToolBar:["message"],
      tab:"message",
      tree: {
        data:[{
          name: '联系人',
          id: 'contact',
          slots : { icon: 'contact' },
          children:[]
        }, {
          name:'群组',
          id: 'room',
          slots : { icon: 'room' },
          children:[]
        }]
      }
    }
  },
  methods:{
    onRoomDelete(data) {
      let id = JSON.parse(data).data;
      let room = this.tree.data.find(d => d.id === "room");

      let exist = room.children.find(r => r.id === "room-" + id);
      if (!exist) {
        return;
      }

      let index = room.children.indexOf(exist);
      room.children.splice(index, 1);
    },
    onRoomCreate(data) {
      let json = JSON.parse(data).data;
      let room = this.tree.data.find(d => d.id === "room");

      room.children.push({
        id: "room-" + json.id,
        name:json.name,
        isLeaf: true,
        remark:json.remark,
        participantList: json.participantList,
        slots : { icon: 'room-children' }
      });
    },
    onRoomRename(data) {
      let json = JSON.parse(data).data;

      let room = this.tree.data.find(d => d.id === "room");

      let exist = room.children.find(r => r.id === "room-" + json.id);
      if (!exist) {
        return;
      }

      room.children[room.children.indexOf(exist)].name = json.name;
    },
    loadTreeData(treeNode) {
      return new Promise((resolve) => {
        if (treeNode.eventKey === "room") {
          this.loadRoomTreeNode(resolve, treeNode);
        } else if (treeNode.eventKey === "contact") {
          this.loadGroupTreeNode(resolve, treeNode);
        } else if (treeNode.eventKey.includes("group-")) {
          this.loadGroupTreeNode(resolve, treeNode, );
        }
      });
    },
    loadUserTreeNode(group, resolve) {

      let param = {};

      param["filter_[groups_info.id_jin]"] = group.id.replace("group-","");
      param["filter_[status_eq]"] = 1;
      param["filter_[id_ne]"] = this.principal.details.id;

      let headers = {};
      headers[process.env.VUE_APP_HEADER_FILTER_RESULT_ID_NAME] = process.env.VUE_APP_HEADER_FILTER_CHAT_ID_VALUE;

      this.$http
          .post("/authentication/console/user/find", this.formUrlencoded(param), {headers: headers})
          .then(r => {
            let data = r.data.data || [];

            data.forEach(d => {
              group.children.push({
                name : this.getPrincipalName(d),
                id: "user-" + d.id,
                isLeaf: true
              });
            });
            resolve();
          });
    },
    loadGroupTreeNode(resolve, treeNode) {
      let param = {};
      param["filter_[sources_jin]"] = ["\"CONSOLE\""];
      param["filter_[status_eq]"] = 1;

      if (treeNode.eventKey.includes("group-")) {
        param["filter_[parent_id_eq]"] = treeNode.eventKey.replace("group-","");
      } else {
        param["filter_[parent_id_eqn]"] = "true";
      }

      let headers = {};
      headers[process.env.VUE_APP_HEADER_FILTER_RESULT_ID_NAME] = process.env.VUE_APP_HEADER_FILTER_CHAT_ID_VALUE;

      this.$http
          .post("/authentication/group/find", this.formUrlencoded(param), {headers: headers})
          .then(r => {
            let data = r.data.data || [];

            data.forEach(d => {
              let newOne = d;

              newOne.id = "group-" + d.id;
              newOne.slots = { icon: 'group' }
              newOne.children = [];
              treeNode.dataRef.children.push(newOne);
            });

            if (treeNode.eventKey.includes("group-")) {
              this.loadUserTreeNode(treeNode.dataRef, resolve);
            } else {
              resolve();
            }
          });
    },
    loadRoomTreeNode(resolve, treeNode) {
      let param = {};
      param["filter_[r.status_eq]"] = 1;

      let headers = {};
      headers[process.env.VUE_APP_HEADER_FILTER_RESULT_ID_NAME] = process.env.VUE_APP_HEADER_FILTER_CHAT_ID_VALUE;
      this.$http
          .post("/socket-server/room/getCurrentPrincipalRooms", this.formUrlencoded(param), {headers: headers})
          .then(r => {
            let data = r.data.data || [];
            data.forEach(d => {
              let newOne = d;

              newOne.id = "room-" + d.id
              newOne.isLeaf = true;
              newOne.slots = {icon: "room-children"};

              treeNode.dataRef.children.push(newOne);
            });
            resolve();
          });
    },
    toolbarSelect(info) {
      this.tab = info.key;
      this.selectedToolBar = [info.key];
    },
    contactContextMenuClick(o) {
      let button = o.key.substring(0, o.key.lastIndexOf("-"));
      let id = button.substring(0, o.key.indexOf("-")) * 1;
      let type = button.substring(o.key.indexOf("-") + 1, button.length) * 1;
      let key = o.key.substring(o.key.lastIndexOf("-") + 1, o.key.length);

      let target = this.contactData.find(c => c.id === id && c.type === type);

      if (!target) {
        return ;
      }

      if (key === "delete") {
        this.$emit("contactContextMenuClick", {key:"delete", target})
      } else if (key === "top") {
        this.$emit("contactContextMenuClick", {key:"top", target})
      } else if (key === "disturb") {
        this.$emit("contactContextMenuClick", {key:"disturb", target})
      }
    },
    selectContact(record){
      let id = record.key.substring(record.key.indexOf("-") + 1, record.key.length) * 1;
      let type = record.key.substring(0, record.key.indexOf("-")) * 1;

      let result = this.contactData.find(c => c.id === id && c.type === type);

      this.selectedKeys = [record.key];
      this.$emit("selectMessageContact", result);
    },
    selectTreeContact(selectedKeys, info) {
      if (!info.node.dataRef.isLeaf) {
        return ;
      }

      let key = info.node.dataRef.id;
      let type = key.includes("user-") ? 10: 20;

      let contact = {
        id: (type === 10 ? key.replace("user-", "") : key.replace("room-", ""))  * 1,
        name: info.node.dataRef.name,
        type:type
      }

      if (type === 20) {
        contact.participantList = info.node.dataRef.participantList;
      }

      this.selectedKeys = [key];
      this.tab = "message";
      this.selectedToolBar = ["message"];
      this.$emit("selectTreeContact", contact);
    }
  }
}

</script>