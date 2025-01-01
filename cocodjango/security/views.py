# security/views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.shortcuts import render

# Temporary storage for CSP violation reports (you might want to use a database for production)
csp_reports = []

@csrf_exempt
def csp_report(request):
    global csp_reports

    if request.method == 'POST':
        report = request.body.decode('utf-8')  # Assuming the report is sent as JSON in the request body
        # Log the CSP violation report
        print("CSP Violation Report Received:", report)
        csp_reports.append(json.loads(report))  # Store the report (you might want to store it in a database)

        return JsonResponse({'status': 'report received'})

    elif request.method == 'GET':
        # Return all stored CSP reports for viewing in the browser
        return JsonResponse({'csp_reports': csp_reports}, json_dumps_params={'indent': 2})

    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)
    
    
def csp_violation(request):
    return render(request, 'csp_violation.html')
