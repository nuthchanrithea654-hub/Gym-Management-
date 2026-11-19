# Run: ruby --disable-gems scripts/validate-k8s.rb
require 'yaml'
require 'set'
base = File.expand_path('../k8s/base', __dir__)
files = Dir["#{base}/*.yaml"].reject { |p| p.end_with?('/kustomization.yaml') }
resources = files.map { |p| YAML.load_file(p) }
assert = ->(ok, message) { raise message unless ok }
objects = resources.group_by { |r| r['kind'] }
deployments = objects.fetch('Deployment')
services = objects.fetch('Service')
assert.call(deployments.size == 7 && services.size == 7, 'Expected seven Deployments and Services')
assert.call(deployments.sum { |d| d['spec']['replicas'] } == 8, 'Expected eight application replicas')
resources.each do |r|
  next if r['kind'] == 'Namespace'
  assert.call(r['metadata']['namespace'] == 'gym-management', 'Wrong namespace')
end
services.each do |service|
  name = service['metadata']['name']
  deployment = deployments.find { |d| d['metadata']['name'] == name }
  assert.call(!deployment.nil?, "Missing Deployment for #{name}")
  assert.call(service['spec']['type'] == 'ClusterIP', "External application service #{name}")
  labels = deployment['spec']['template']['metadata']['labels']
  assert.call(service['spec']['selector'] == labels, "Service selector mismatch #{name}")
  assert.call(deployment['spec']['selector']['matchLabels'] == labels, "Deployment selector mismatch #{name}")
  containers = deployment['spec']['template']['spec']['containers']
  main = containers.find { |c| c['name'] == name }
  assert.call(main['image'] == "gym/#{name}:k8s-v1" && main['imagePullPolicy'] == 'Never', 'Local image mismatch')
  assert.call(main['ports'][0]['containerPort'] == service['spec']['ports'][0]['port'], 'Port mismatch')
  expected = name == 'api-gateway' ? '/' : '/readyz'
  assert.call(main['readinessProbe']['httpGet']['path'] == expected, 'Readiness mismatch')
  assert.call(main['livenessProbe']['httpGet']['path'] == '/', 'Liveness mismatch')
end
ingress = objects.fetch('Ingress').first
rule = ingress['spec']['rules'].first
assert.call(rule['host'] == 'gym.aupp.com', 'Ingress hostname mismatch')
paths = rule['http']['paths']
assert.call(paths.map { |p| p['path'] }.to_set == %w[/ /register /login /memberships /server /payments /classes /bookings].to_set, 'Ingress paths mismatch')
paths.each do |p|
  assert.call(p['pathType'] == 'Prefix', 'Wrong pathType')
  assert.call(p['backend']['service'] == {'name'=>'api-gateway','port'=>{'number'=>5050}}, 'Ingress bypasses gateway')
end
gateway = deployments.find { |d| d['metadata']['name'] == 'api-gateway' }['spec']['template']['spec']
assert.call(gateway['containers'].size == 2, 'Gateway sidecar missing')
mounts = gateway['containers'].map { |c| c['volumeMounts'].first }
assert.call(mounts.all? { |m| m['name'] == 'access-logs' && m['mountPath'] == '/app/logs' }, 'Shared mount mismatch')
assert.call(mounts[1]['readOnly'] == true, 'Reader must mount read-only')
assert.call(gateway['volumes'].first.key?('emptyDir'), 'emptyDir missing')
secret = YAML.load_file(File.expand_path('../k8s/templates/secret.example.yaml', __dir__))
assert.call(secret['metadata']['name'] == 'gym-secrets', 'Secret name mismatch')
secret_keys = secret['stringData'].keys
assert.call(secret_keys.size == 7 && secret['stringData'].values.all? { |v| v.start_with?('REPLACE_') }, 'Secret template must contain only placeholders')
deployments.each do |d|
  d['spec']['template']['spec']['containers'].first['env'].each do |env|
    ref = env.dig('valueFrom', 'secretKeyRef')
    assert.call(ref['name'] == 'gym-secrets' && secret_keys.include?(ref['key']), 'Secret reference mismatch') if ref
  end
end
inventory = YAML.load_file("#{base}/kustomization.yaml")['resources']
assert.call(inventory.to_set == files.map { |p| File.basename(p) }.to_set, 'Kustomize inventory mismatch')
puts "Validated #{resources.size} YAML resources, eight replicas, all selectors/ports/probes/secret references, gateway-only ingress and shared volume."
