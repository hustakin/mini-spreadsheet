import {AfterViewInit, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  rows = 40;
  cols = 20;
  matrix: any[][];

  enteringFormula = false;
  formulas = {};

  constructor() {
    this.constructBlankMatrix();
  }

  ngOnInit() {
    // this.parseFormula('=DA21 + BA*3');
    console.log(this.getColHeader(26));
    console.log(this.getColIndex('AA'));
  }

  ngAfterViewInit() {
    this.getInputHTMLElement(0, 0).focus();
  }

  constructBlankMatrix() {
    const matrix = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(null);
      }
      matrix.push(row);
    }
    this.matrix = matrix;
  }

  reloadMatrix() {
    const matrix = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        if (this.matrix[r] && this.matrix[r][c]) {
          row.push(this.matrix[r][c]);
        } else {
          row.push(null);
        }
      }
      matrix.push(row);
    }
    this.matrix = matrix;
  }

  printMatrix() {
    console.log(this.matrix);
  }

  getInputHTMLElement(row, col): HTMLInputElement {
    return document.getElementById('mini-cel:' + row + '-' + col) as HTMLInputElement;
  }

  changedAt(row, col, value) {
    console.log('Changed value ' + row + ', ' + col + ': ' + value);
  }

  changingAt(row, col, value) {
    if (row === this.rows - 1) {
      this.rows += 1;
    }
    if (col === this.cols - 1) {
      this.cols += 1;
    }
    this.reloadMatrix();
  }

  enteredFormula(row, col, formula) {
    console.log('Just entered formula ' + row + '-' + col + ': ' + formula);
  }

  parseFormula(formula: string) {
    if (formula == null || formula.length === 0 || !formula.startsWith('=')) {
      return null;
    }
    formula = formula.trim();
    formula = formula.replace(/ /g, '');
    formula = formula.substring(1);
    if (formula.length === 0) {
      return null;
    }
    console.log(formula);
    const labels = formula.match(/[^\+\-\*\/]+/g);
    console.log(labels);
    for (const label of labels) {
      const validLabel = new RegExp(/^[A-Z]+[0-9]+$/);
      const isValid = validLabel.test(label) || !isNaN(Number(label));
      if (!isValid) {
        alert('Invalid formula label: ' + label);
      }
    }
    return;
  }

  // convertLabelToValue(label: string) {
  //   let header = '';
  //   for (let i = 0; i < base26.length; i++) {
  //     const cBase10 = parseInt(base26[i], 26);
  //     if (i < base26.length - 1) {
  //       header += this.chars.charAt(Number(cBase10) - 1);
  //     } else {
  //       header += this.chars.charAt(Number(cBase10));
  //     }
  //   }
  // }

  keypress(row, col, e) {
    if (e.keyCode === 187) {
      if (e.target.value && e.target.value.startsWith('=')) {
        this.move(row, col, '=');
        return;
      }
    }
  }

  move(row, col, key) {
    if (key === 'UP' && row > 0) {
      this.getInputHTMLElement(row - 1, col).focus();
    } else if (key === 'LEFT' && col > 0) {
      this.getInputHTMLElement(row, col - 1).focus();
    } else if (key === 'DOWN' && row < this.rows - 1) {
      this.getInputHTMLElement(row + 1, col).focus();
    } else if (key === 'RIGHT' && col < this.cols - 1) {
      this.getInputHTMLElement(row, col + 1).focus();
    } else if (key === '=') {
      console.log('Starting formula');
      this.enteringFormula = true;
    } else if (key === 'ENTER') {
      if (this.enteringFormula) {
        this.enteredFormula(row, col, this.getInputHTMLElement(row, col).value);
      }
      this.enteringFormula = false;
    }
  }

  getColHeader(index: number) {
    if (index < 26) {
      return this.chars.charAt(index);
    }
    const base26 = index.toString(26);
    let header = '';
    for (let i = 0; i < base26.length; i++) {
      const cBase10 = parseInt(base26[i], 26);
      if (i < base26.length - 1) {
        header += this.chars.charAt(Number(cBase10) - 1);
      } else {
        header += this.chars.charAt(Number(cBase10));
      }
    }
    return header;
  }

  getColIndex(header: string) {
    if (header.length === 1) {
      return parseInt(header, 26);
    }
    let base10 = 0;
    let pow = 0;
    for (let i = header.length - 1; i >= 0; i--) {
      const loc = this.chars.indexOf(header[i]) + 1;
      console.log(header[i] + ': ' + loc);
      base10 += base10 + loc * Math.pow(26, pow);
      console.log(base10);
      pow++;
    }
    return base10;
  }
}
