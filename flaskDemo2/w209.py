from flask import Flask
from flask import render_template
import pandas as pd
import os

app = Flask(__name__)


@app.route("/")
def index():
    return render_template('index.html')


@app.route("/data/<year>")
def data(year):
    dir_path = os.path.dirname(os.path.realpath(__file__))
    df = pd.read_csv(os.path.join(dir_path,"static","1_Revenues.csv"))
    return df[df["Year4"]==int(year)][["Year4", "Total Revenue", "State Code", "Name"]].to_json(orient="records")


@app.route("/hi/<name>")
def hello(name):
    return render_template('hi.html', myName=name)


if __name__ == '__main__':
  app.run()
