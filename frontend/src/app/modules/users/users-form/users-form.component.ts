import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-users-form',
  templateUrl: './users-form.component.html',
  styleUrls: ['./users-form.component.css']
})
export class UsersFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  userId: number | null = null;
  loading = false;
  loadingData = false;
  errorMsg = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!idParam;
    this.userId = idParam ? +idParam : null;

    this.buildForm();

    if (this.isEdit && this.userId) {
      this.loadUser(this.userId);
    }
  }

  private readonly emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  private buildForm(): void {
    this.form = this.fb.group({
      name:      ['', [Validators.required, Validators.minLength(2)]],
      email:     ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      password:  ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
      role:      ['user', Validators.required],
      is_active: [1]
    });
  }

  private loadUser(id: number): void {
    this.loadingData = true;
    this.usersService.getById(id).subscribe({
      next: res => {
        const u = res.data;
        this.form.patchValue({
          name:      u.name,
          email:     u.email,
          role:      u.role,
          is_active: u.is_active
        });
        this.loadingData = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar usuario';
        this.loadingData = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    const value = this.form.value;
    const payload: any = {
      name:      value.name,
      email:     value.email,
      role:      value.role,
      is_active: value.is_active ? 1 : 0
    };

    // Only send password if provided
    if (value.password) {
      payload.password = value.password;
    }

    const request = this.isEdit && this.userId
      ? this.usersService.update(this.userId, payload)
      : this.usersService.create(payload);

    request.subscribe({
      next: () => this.router.navigate(['/dashboard/users']),
      error: err => {
        this.errorMsg = err.error?.message || 'Error al guardar usuario';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/users']);
  }

  field(name: string) { return this.form.get(name); }
}
