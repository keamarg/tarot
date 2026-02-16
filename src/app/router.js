import { createRouter, createWebHistory } from "vue-router";
const HomeView = () => import("@/modules/home/HomeView.vue");
const TrainingView = () => import("@/modules/training/TrainingView.vue");
const ReadingView = () => import("@/modules/reading/ReadingView.vue");
const SettingsView = () => import("@/modules/settings/SettingsView.vue");
export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "home",
            component: HomeView
        },
        {
            path: "/training",
            name: "training",
            component: TrainingView
        },
        {
            path: "/reading",
            name: "reading",
            component: ReadingView
        },
        {
            path: "/settings",
            name: "settings",
            component: SettingsView
        }
    ]
});
