import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
    // Use environment variable if available, otherwise fallback to 'barbershop'
    const tenantId = environment.tenantId || 'barbershop';

    const clonedReq = req.clone({
        setHeaders: {
            'X-Tenant-ID': tenantId
        }
    });

    return next(clonedReq);
};
