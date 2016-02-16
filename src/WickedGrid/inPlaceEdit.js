/**
 * Creates a textarea for a user to put a value in that floats on top of the current selected cell
 * @param {WickedGrid} wickedGrid
 * @param {jQuery|HTMLElement} td the td to be edited
 * @param {Boolean} selected selects the text in the inline editor.controlFactory
 */
WickedGrid.inPlaceEdit = function(wickedGrid, td, selected) {
  td = td || wickedGrid.cellActive().td || null;

  if (td === null) {
    td = wickedGrid.rowTds(null, 1)[1];
    wickedGrid.cellEdit(td);
  }

  if (td === null) return;

  (wickedGrid.inPlaceEdit().destroy || empty)();

  var formula = wickedGrid.formula(),
      val = formula.val(),
      textarea,
      $textarea,
      pane = wickedGrid.pane();

  if (!td.isHighlighted) return; //If the td is a dud, we do not want a textarea

  textarea = document.createElement('textarea');
  $textarea = $(textarea);
  pane.inPlaceEdit = textarea;
  textarea.i = jS.i;
  textarea.className = this.cl.inPlaceEdit + ' ' + this.theme.inPlaceEdit;
  textarea.td = td;
  //td / tr / tbody / table
  textarea.table = td.parentNode.parentNode.parentNode;
  textarea.goToTd = function() {
    this.offset = $(td).position();
    if (!this.offset.left && !this.offset.right) {
      $(textarea).hide();
    } else {
      this.setAttribute('style',
          'left:' + (this.offset.left - 1) + 'px;' +
          'top:' + (this.offset.top - 1) + 'px;' +
          'width:' + this.td.clientWidth + 'px;' +
          'height:' + this.td.clientHeight + 'px;' +
          'min-width:' + this.td.clientWidth + 'px;' +
          'min-height:' + this.td.clientHeight + 'px;');
    }
  };
  textarea.goToTd();
  textarea.onkeydown = function (e) {
    e = e || window.event;
    wickedGrid.trigger('sheetFormulaKeydown', [true]);

    switch (e.keyCode) {
      case key.ENTER:
        return jS.evt.inPlaceEdit.enter(e);
        break;
      case key.TAB:
        return jS.evt.inPlaceEdit.tab(e);
        break;
      case key.ESCAPE:
        jS.evt.cellEditAbandon();
        return false;
        break;
    }
  };
  textarea.onchange =
      textarea.onkeyup =
          function() { formula[0].value = textarea.value; };

  textarea.onfocus = function () { jS.setNav(false); };

  textarea.onblur =
      textarea.onfocusout =
          function () { jS.setNav(true); };

  textarea.onpaste = jS.evt.pasteOverCells;

  textarea.destroy = function () {
    pane.inPlaceEdit = null;
    jS.cellLast.isEdit = (textarea.value != val);
    textarea.parentNode.removeChild(textarea);
    jS.controls.inPlaceEdit[textarea.i] = false;
  };

  pane.appendChild(textarea);

  textarea.onfocus();

  jS.controls.inPlaceEdit[jS.i] = textarea;

  //This is a little trick to get the cursor to the end of the textarea
  $textarea
      .focus()
      .val('')
      .val(formula[0].value);

  if (selected) {
    $textarea.select();
  }

  //Make the textarea resizable automatically
  if ($.fn.elastic) {
    $(textarea).elastic();
  }

  function enter(e) {
    if (e.shiftKey) {
      return true;
    }
    return wickedGrid.cellSetActiveFromKeyCode(e, true);
  }

  function tab(e) {
    if (e.shiftKey) {
      return true;
    }
    return wickedGrid.cellSetActiveFromKeyCode(e, true);
  }
};