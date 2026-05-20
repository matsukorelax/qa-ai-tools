from flask import Flask, request, jsonify
import subprocess
import threading
import uuid

app = Flask(__name__)

# TODO: job の状態を管理する辞書を作る
# 例: { "job_id": { "status": "running", "output": "" } }
jobs = {}


@app.route("/run", methods=["POST"])
def run():
    data = request.json
    url = data.get("url")
    context = data.get("context")
    platform = data.get("platform", "ios")

    # TODO: job_id を発行する（uuid4 を文字列にする）
    job_id = None

    # TODO: jobs に job_id を登録する（status: "running"）
    # jobs[job_id] = ???

    thread = threading.Thread(target=run_bugrepro, args=(job_id, url, context, platform))
    thread.daemon = True
    thread.start()

    return jsonify({"job_id": job_id})


def run_bugrepro(job_id: str, url: str, context: str, platform: str):
    # TODO: BugRepro の CLI コマンドを組み立てる
    # npx tsx --env-file=.env src/cli.ts generate <url> --platform <platform> --context "<context>"
    cmd = None

    result = subprocess.run(cmd, capture_output=True, text=True, shell=True, cwd=".")

    # TODO: 実行結果で jobs[job_id] を更新する
    # status は "done"（成功）か "failed"（失敗）
    # result.stdout / result.stderr / result.returncode が使える
    # jobs[job_id] = ???


@app.route("/status/<job_id>", methods=["GET"])
def status(job_id: str):
    # TODO: jobs から job_id の状態を取り出して返す
    # 存在しない job_id なら 404 を返す
    job = None

    if job is None:
        return jsonify({"error": "not found"}), 404

    return jsonify(job)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8765)
