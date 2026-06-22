import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatch(g: AbstractControl) {
  return g.get('password')?.value === g.get('confirm')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    this.form = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', [Validators.required, Validators.pattern(emailPattern)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm:  ['', Validators.required]
    }, { validators: passwordMatch });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const { name, email, password } = this.form.value;
    this.auth.register({ name, email, password, role: 'admin' }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.errorMsg = err.error?.message || 'Error al registrar';
        this.loading = false;
      }
    });
  }

  field(name: string) { return this.form.get(name); }
}
