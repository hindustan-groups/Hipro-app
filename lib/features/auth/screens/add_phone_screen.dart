import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/session/user_session.dart';



class AddPhoneScreen extends StatefulWidget {
  final VoidCallback onphoneSaved;

  const AddPhoneScreen({
    super.key,
    required this.onphoneSaved
  });

  @override
  State<AddPhoneScreen> createState() =>_AddPhoneScreenState();

}
class _AddPhoneScreenState extends State<AddPhoneScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  
  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }
  Future<void> _savePhoneNumber() async {
    if (!_formKey.currentState!.validate()) return;
    
    final session = UserSession();
    final token = session.token;

    if (token == null || token.isEmpty) {
      _showMessage('please login again');
      return;
    }

    setState(() {
      _isLoading = true;
    });
    try {
       final response = await _apiClient.dio.patch(
        '/auth/phone',
        data: {
          'phoneNumber': _phoneController.text.trim()
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          }
        ),
       );
       final data = response.data;
       final user = data is Map ? data['user'] :null;
       if (response.statusCode == 200 && 
       data is Map && data['success'] == true ) {
         await session.setUser(
          name: user is Map ?
          user['name']?.toString() ?? session.name : session.name,
         email: user is Map
              ? user['email']?.toString() ?? session.email
              : session.email,
          photoUrl: session.photoUrl,
          phone: user is Map
              ? user['phoneNumber']?.toString()
              : _phoneController.text.trim(),
          token: token, 
         );
         if (!mounted) return;
         _showMessage('mobile number saved successfully');
         widget.onphoneSaved();
       }
       else {
        _showMessage('could not save mobile number');
       }
    }  on DioException catch (e) {
      if(!mounted) return;
      final data = e.response?.data;
      final message = data is Map ? data['message']?.toString():null;
      _showMessage(message ?? 'something went wrong please try again');
    }
    finally {
        if (mounted) {
        setState(() => _isLoading = false);
      }
    
    }
  }
  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message))
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('add mobile number'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(child: Center(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Form(child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(
                  Icons.phone_android,
                  size: 76,
                  color: Colors.blue,
                ),
                const SizedBox(height: 24),
                const Text(
                  'add your phone number',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold
                  ),
                ),
                const SizedBox(height: 12,),
                const Text(
                  'please enter your mobile number to continue'
                  'with your service request',
                  textAlign: TextAlign.center,

                ),
                const SizedBox(height: 28),
                 TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    decoration: const InputDecoration(
                      labelText: 'mobile number',
                      hintText:'enter 10 digit number',
                      prefixText:'+91',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone)  
                    ),
                    validator: (value) {
                      final phone = (value ?? '').trim();

                      if (!RegExp(r'^[6-9][0-9]{9}$').hasMatch(phone)) {
                          return 'Enter a valid 10-digit mobile number';
                      }
                      return null;
                    },
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _isLoading ? null :_savePhoneNumber , 
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                child: _isLoading ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                  ),
                ):
                const Text('Save and Continue')
                ),
              ],
            ))
          ),
        ),
      )),
    );
}
}