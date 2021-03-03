import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {SelectionModel} from '@angular/cdk/collections';
import {filter, map, startWith, tap} from 'rxjs/operators';

interface SimpleTreeNode {
  name: string;
  children?: this[];
}

@Component({
  selector: 'app-tree-autocomplete-control',
  templateUrl: './tree-autocomplete-control.component.html',
  styleUrls: ['./tree-autocomplete-control.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TreeAutocompleteControlComponent),
    multi: true
  }]
})
export class TreeAutocompleteControlComponent<T extends SimpleTreeNode> implements OnInit, ControlValueAccessor {
  @Input() disabled = false;
  @Input() label = '';
  @Input() treeData!: T[];

  autoInput = new FormControl();
  treeControl = new NestedTreeControl<T>(node => node.children);
  dataSource = new MatTreeNestedDataSource<T>();
  selection = new SelectionModel<string>(false);

  private _value!: T | null;
  get value(): T | null {
    return this._value;
  }
  @Input()
  set value(value: T | null) {
    this._value = value;
    this.onChange(value);
  }

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor() {
    this.writeValue(null);
  }

  ngOnInit(): void {
    this.dataSource.data = this.treeData;
    this.autoInput.valueChanges
      .pipe(
        startWith(''),
        filter(value => !!value),
        map(value => typeof value === 'string' ? value : value.name),
        tap(name => this.dataSource.data = this._filter(name, this.treeData))
      ).subscribe();
    this.writeValue(this.value);
  }

  writeValue(node: T | null): void {
    this.value = node;
    this.autoInput.patchValue(this.value);
    this.value ? this.selection.select(this.value.name) : this.selection.deselect();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  hasChild = (_: number, node: T) => !!node.children && node.children.length > 0;

  selectOption(node: T): void {
    this.writeValue(node);
    // this.autoInput.openPanel(); // TODO keep panel opened
  }

  deselectOption(): void {
    this.writeValue(null);
  }

  displayFn(node: T): string {
    return node && node.name ? node.name : '';
  }

  private _filter(searchTerm: string, nodes: T[]): any { // FIXME any
    return nodes.map(node => {
      if (this._found(searchTerm, node.name)) {
        return {name: node.name, children: node.children};
      } else if (this._hasChild(node)) {
        const filteredChildren = this._filter(searchTerm, node.children!);
        if (filteredChildren.length > 0) {
          return {
            name: node.name,
            children: filteredChildren
          };
        }
      }
      return null;
    }).filter(value => !!value);
  }

  private _hasChild(node: T): boolean {
    return node.children !== undefined && node.children.length > 0;
  }

  private _found(searchTerm: string, value: string): boolean {
    return value.toLowerCase().includes(searchTerm.toLowerCase());
  }
}
