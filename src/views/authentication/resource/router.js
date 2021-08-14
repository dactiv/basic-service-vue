export const router = [{
    path: "authentication/resource",
    component: () => import("@/views/authentication/resource/Index.vue"),
    name: "resource",
    meta: {
        title: "資源管理",
        parent: "system"

    }
},{
    path: "authentication/resource/detail",
    component: () => import("@/views/authentication/resource/Detail.vue"),
    name: "resource_detail",
    meta: {
        title: "查看資源",
        parent: "system",
        selectMenu: "/index/resource"
    }
}]