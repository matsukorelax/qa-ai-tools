import os
from datetime import datetime
import subprocess
import threading
import tkinter as tk

BG = "#1e1e1e"
FG = "#ffffff"
ENTRY_BG = "#2d2d2d"

BUGREPRO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "BugRepro"))

DEVICES = ["webview", "ios", "android"]

def _label(parent, text):
    return tk.Label(parent, text=text, bg=BG, fg=FG, anchor="w")


def _entry(parent, default=""):
    e = tk.Entry(parent, bg=ENTRY_BG, fg=FG, insertbackground=FG, relief="flat", bd=6)
    e.insert(0, default)
    return e


def show_bugrepro_form(root):
    for widget in root.winfo_children():
        if isinstance(widget, tk.Toplevel) and getattr(widget, "_is_bugrepro", False):
            widget.destroy()
            return

    win = tk.Toplevel(root)
    win._is_bugrepro = True
    win.title("BugRepro")
    win.configure(bg=BG)
    win.attributes("-topmost", True)
    win.resizable(False, False)

    pad = {"padx": 12, "pady": 4}

    _label(win, "URL").pack(fill="x", **pad)
    url_entry = _entry(win)
    url_entry.pack(fill="x", **pad)

    _label(win, "viewport").pack(fill="x", **pad)
    viewport_entry = _entry(win, default="1600x900")
    viewport_entry.pack(fill="x", **pad)
    
    _label(win, "スクショタイトル").pack(fill="x", **pad)
    title_entry = _entry(win)
    title_entry.pack(fill="x", **pad)

    _label(win, "コンテキスト").pack(fill="x", **pad)
    context_entry = _entry(win)
    context_entry.pack(fill="x", **pad)

    _label(win, "プラットフォーム").pack(fill="x", **pad)
    platform_var = {k: tk.BooleanVar() for k in DEVICES}
    platform_frame = tk.Frame(win, bg=BG)
    platform_frame.pack(fill="x", **pad)
    for text, value in [("PC", "webview"), ("iOS", "ios"), ("Android", "android")]:
        tk.Checkbutton(
            platform_frame, text=text, variable=platform_var[value],
            bg=BG, fg=FG, selectcolor="#444", activebackground=BG
        ).pack(side="left", padx=4)

    _label(win, "ステータス").pack(fill="x", **pad)
    status_var = tk.StringVar(value="guest")
    status_frame = tk.Frame(win, bg=BG)
    status_frame.pack(fill="x", **pad)
    for text, value in [("ゲスト", "guest"), ("ログイン", "login")]:
        tk.Radiobutton(
            status_frame, text=text, variable=status_var, value=value,
            bg=BG, fg=FG, selectcolor="#444", activebackground=BG
        ).pack(side="left", padx=4)
    
    _label(win, "スクリーンショット").pack(fill="x", **pad)
    vision_var = tk.BooleanVar(value=False)
    tk.Checkbutton(
        win, text="AIにスクショを渡す", variable=vision_var,
        bg=BG, fg=FG, selectcolor="#444", activebackground=BG
    ).pack(anchor="w", **pad)

    _label(win, "結果").pack(fill="x", **pad)
    result_text = tk.Text(win, height=8, bg=ENTRY_BG, fg=FG, relief="flat", bd=6, state="disabled")
    result_text.pack(fill="both", expand=True, **pad)

    def on_submit():
        url = url_entry.get().strip()
        if not url:
            return
        context = context_entry.get().strip()
        status = status_var.get()
        title = title_entry.get().strip()
        viewport = viewport_entry.get().strip()
        vision =vision_var.get()

        result_text.config(state="normal")
        result_text.delete("1.0", "end")
        result_text.insert("end", "実行中...")
        result_text.config(state="disabled")
        submit_btn.config(state="disabled")

        def run():
            selected = []
            timestamp = datetime.now().strftime("%m%d-%H%M")
            safe_title = title.replace(" ", "_") if title else "output"
            output_path = os.path.join(BUGREPRO_DIR, "generated", f"{safe_title}_{timestamp}.spec.ts")
            
            for value, var in platform_var.items():
                if var.get():
                    selected.append(value)
            if not selected:
                selected = ["webview"]
            for platform in selected:
                cmd = [r"C:\nvm4w\nodejs\npx.cmd", "tsx", "src/cli.ts", "generate", url]
                if context:
                    cmd += ["--context", context]
                cmd += ["--title", title]
                cmd += ["--auth", status]
                cmd += ["--platform", platform]
                cmd += ["--output", output_path]
                if vision:
                    cmd += ["--vision"]
                if viewport:
                    cmd += ["--viewport", viewport]
                try:
                    proc = subprocess.run(cmd, 
                    cwd=BUGREPRO_DIR, 
                    capture_output=True, 
                    text=True,
                    encoding="utf-8"
                    )
                    output = proc.stdout or proc.stderr or "出力が空です"
                except Exception as e:
                    output = str(e)
                win.after(0, lambda: show_result(output))

        def show_result(output):
            result_text.config(state="normal")
            result_text.delete("1.0", "end")
            result_text.insert("end", output)
            result_text.config(state="disabled")
            submit_btn.config(state="normal")

        threading.Thread(target=run, daemon=True).start()

    btn_frame = tk.Frame(win, bg=BG)
    btn_frame.pack(fill="x", pady=8)
    submit_btn = tk.Button(
        btn_frame, text="実行", command=on_submit,
        bg="#3a7bd5", fg=FG, relief="flat", padx=16, pady=4
    )
    submit_btn.pack(side="right", padx=12)
    tk.Button(
        btn_frame, text="閉じる", command=win.destroy,
        bg="#3a3a3a", fg=FG, relief="flat", padx=16, pady=4
    ).pack(side="right", padx=4)
