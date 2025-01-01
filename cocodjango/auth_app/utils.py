
def custom_username_from_request(request):
    print(request)
   
    if request.path.startswith('/admin/'):
        return request.GET.get('username') 
    
    elif request.data.get('username',None):
        return request.data.get('username')

