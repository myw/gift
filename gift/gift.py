from flask import Flask, redirect, render_template, request, url_for


app = Flask(__name__)


@app.route('/')
def index():
  """ Render the index page, which prompts the user for a word """
  word = request.values.get('word', None)

  if word is None:
    return render_template('index.html')
  else:
    return redirect(url_for('gift', word=str(word)))


@app.route('/<word>')
def gift(word=None):
  """ Render the page that shows the gift, given a seed word """
  # Always redirect to a canonical, lower-case representation of the word
  lowerword = word.lower()
  if lowerword == word:
    return render_template('gift.html', word=word)
  else:
    return redirect(url_for('gift', word=lowerword))


@app.route('/favicon.ico')
def favicon():
  """ Render the favicon """
  return redirect(url_for('static', filename='favicon.ico'))


if __name__ == '__main__':
  app.run(debug=True)
