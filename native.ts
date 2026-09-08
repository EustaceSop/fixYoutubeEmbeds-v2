/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RendererSettings } from "@main/settings";
import { app } from "electron";

const youtubeOrigins = new Set([
    "https://www.youtube.com",
    "http://www.youtube.com",
    "https://music.youtube.com",
    "http://music.youtube.com"
]);

app.on("browser-window-created", (_, win) => {
    win.webContents.on("frame-created", (_, { frame }) => {
        frame.once("dom-ready", () => {
            let origin: string;

            try {
                origin = new URL(frame.url).origin;
            } catch {
                return;
            }

            if (!youtubeOrigins.has(origin)) return;
            if (!RendererSettings.store.plugins?.FixYoutubeEmbeds?.enabled) return;

            void frame.executeJavaScript(`
                (() => {
                    if (window.__vencordFixYoutubeEmbeds) return;
                    window.__vencordFixYoutubeEmbeds = true;

                    const isBlockedEmbed = () => {
                        const bodyText = document.body?.innerText ?? "";
                        const links = Array.from(document.querySelectorAll("a"));

                        return links.some(link => {
                            const href = link.href || link.getAttribute("href") || "";
                            return href.includes("youtube.com/watch?v=") &&
                                (href.includes("feature=emb_err") ||
                                    bodyText.includes("UMG") ||
                                    bodyText.includes("著作"));
                        });
                    };

                    const check = () => {
                        if (isBlockedEmbed()) location.reload();
                    };

                    if (document.body) {
                        new MutationObserver(check).observe(document.body, {
                            childList: true,
                            subtree: true
                        });
                        check();
                    }
                })();
            `).catch(() => undefined);
        });
    });
});
