export const router = [{
    path: "authentication/member/user",
    component: () => import("@/views/authentication/member/user/Index.vue"),
    name: "member_user",
    meta: {
        title: "会员用户管理",
        parent: "system"

    }
},{
    path: "authentication/member/user/detail",
    component: () => import("@/views/authentication/member/user/Detail.vue"),
    name: "member_user_detail",
    meta: {
        title: "查看会员用户",
        parent: "system",
        selectMenu: "/index/member/user"
    }
}]